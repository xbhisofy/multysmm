import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import {
  verifyOrderWithGateway,
  claimEvent,
  amountsMatch,
  handleAmountMismatch,
  markFailed,
  recordFailureStrike,
  telegramCreditAlert,
} from '../_shared/zapupi-security.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Always 200 OK to gateway to prevent retry-storms. Log internally.
  try {
    let payload: any = {}
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      payload = await req.json().catch(() => ({}))
    } else {
      const text = await req.text()
      try { payload = JSON.parse(text) } catch {
        payload = Object.fromEntries(new URLSearchParams(text).entries())
      }
    }

    const orderId: string | undefined =
      payload?.order_id || payload?.orderId || payload?.data?.order_id
    if (!orderId) return json({ ok: true, note: 'no order_id' })

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

    // ─── Load deposit (server-side amount of record) ──────────────────────
    const { data: dep } = await admin
      .from('zapupi_deposits')
      .select('id,user_id,credited,status,amount_inr')
      .eq('order_id', orderId).maybeSingle()
    if (!dep) return json({ ok: true, note: 'unknown order' })

    // ─── Mandatory gateway re-verification ────────────────────────────────
    const verify = await verifyOrderWithGateway(orderId)

    // ─── Layer 4: Replay / idempotency claim ──────────────────────────────
    const claim = await claimEvent({
      admin, source: 'webhook', orderId,
      txn_id: verify.txn_id, utr: verify.utr,
      status: verify.statusStr || 'unknown',
      payload: { webhook: payload, verify: verify.raw },
    })
    if (!claim.ok) return json({ ok: true, replay: true })

    if (!verify.success) {
      await admin.from('zapupi_deposits').update({
        gateway_response: { webhook: payload, verify: verify.raw },
      }).eq('order_id', orderId)
      if (verify.statusStr === 'failed' || verify.statusStr === 'cancelled' || verify.statusStr === 'expired') {
        await markFailed(admin, orderId, { webhook: payload, verify: verify.raw })
        await recordFailureStrike({
          admin, userId: dep.user_id, orderId,
          source: 'webhook', reason: 'gateway_failed',
        })
      }
      return json({ ok: true, verified: false, status: verify.statusStr })
    }

    if (dep.credited) return json({ ok: true, already_credited: true })

    // ─── Layer 3: Amount-match guard (zero-trust) ─────────────────────────
    if (!amountsMatch(Number(dep.amount_inr), verify.paid_amount)) {
      await handleAmountMismatch({
        admin, userId: dep.user_id, orderId,
        expectedInr: Number(dep.amount_inr),
        paidInr: verify.paid_amount,
        verifyRaw: verify.raw,
        source: 'webhook',
      })
      return json({ ok: true, mismatch: true })
    }

    // ─── Credit wallet using SERVER-side amount of record ─────────────────
    const { data: creditResult, error } = await admin.rpc('credit_wallet_zapupi', {
      p_order_id: orderId,
      p_txn_id: verify.txn_id ?? null,
      p_utr: verify.utr ?? null,
      p_gateway_response: { webhook: payload, verify: verify.raw },
    })
    if (error) {
      console.error('credit_wallet_zapupi error', error)
      return json({ ok: true, credit_error: error.message })
    }
    if ((creditResult as any)?.credited && !(creditResult as any)?.duplicate) {
      await telegramCreditAlert(admin, orderId, 'webhook').catch((e) => console.error('tg credit alert', e))
    }
    return json({ ok: true, result: creditResult })
  } catch (e) {
    console.error('webhook error', e)
    return json({ ok: true, error: String((e as Error).message || e) })
  }
})

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}
