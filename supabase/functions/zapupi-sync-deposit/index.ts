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
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token)
    if (claimsErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401)
    const userId = claims.claims.sub as string

    const body = await req.json().catch(() => ({}))
    const orderId: string | undefined = body?.order_id
    if (!orderId) return json({ error: 'order_id required' }, 400)

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
    const { data: dep, error: depErr } = await admin
      .from('zapupi_deposits')
      .select('id,user_id,credited,status,amount_inr')
      .eq('order_id', orderId).maybeSingle()
    if (depErr || !dep) return json({ error: 'Order not found' }, 404)
    if (dep.user_id !== userId) return json({ error: 'Forbidden' }, 403)
    if (dep.credited) return json({ credited: true, already: true })

    const verify = await verifyOrderWithGateway(orderId)

    // Layer 4: idempotency claim
    const claim = await claimEvent({
      admin, source: 'sync', orderId,
      txn_id: verify.txn_id, utr: verify.utr,
      status: verify.statusStr || 'unknown',
      payload: { sync_verify: verify.raw },
    })
    if (!claim.ok) return json({ credited: dep.credited, replay: true })

    if (!verify.success) {
      await admin.from('zapupi_deposits').update({
        gateway_response: { sync_verify: verify.raw },
      }).eq('order_id', orderId)
      if (verify.statusStr === 'failed' || verify.statusStr === 'cancelled' || verify.statusStr === 'expired') {
        await markFailed(admin, orderId, { sync_verify: verify.raw })
        await recordFailureStrike({
          admin, userId: dep.user_id, orderId,
          source: 'sync', reason: 'gateway_failed',
        })
      }
      return json({ credited: false, status: verify.statusStr || 'pending' })
    }

    // Layer 3: amount-match guard
    if (!amountsMatch(Number(dep.amount_inr), verify.paid_amount)) {
      await handleAmountMismatch({
        admin, userId: dep.user_id, orderId,
        expectedInr: Number(dep.amount_inr),
        paidInr: verify.paid_amount,
        verifyRaw: verify.raw,
        source: 'sync',
      })
      return json({ credited: false, mismatch: true }, 400)
    }

    const { data, error } = await admin.rpc('credit_wallet_zapupi', {
      p_order_id: orderId,
      p_txn_id: verify.txn_id ?? null,
      p_utr: verify.utr ?? null,
      p_gateway_response: { sync_verify: verify.raw },
    })
    if (error) return json({ error: error.message }, 500)
    if ((data as any)?.credited && !(data as any)?.duplicate) {
      telegramCreditAlert(admin, orderId, 'sync').catch((e) => console.error('tg credit alert', e))
    }
    return json({ credited: true, result: data })
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500)
  }
})

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}
