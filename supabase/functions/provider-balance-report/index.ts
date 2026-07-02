import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function getUsdToInrRate(): Promise<number> {
  try {
    const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const j = await r.json()
    const rate = Number(j?.rates?.INR)
    if (rate && rate > 0) return rate
  } catch (_) {}
  return 84
}

async function sendTg(botToken: string, chatId: string, text: string) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    })
    const j = await r.json()
    return { ok: !!j?.ok, resp: j }
  } catch (e: any) {
    return { ok: false, resp: { error: e?.message } }
  }
}

async function refreshBalances(accounts: any[], usdToInr: number) {
  for (const acc of accounts) {
    try {
      const formData = new URLSearchParams()
      formData.append('key', acc.api_key)
      formData.append('action', 'balance')

      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), 12000)
      const resp = await fetch(acc.api_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: controller.signal,
      })
      clearTimeout(t)

      const text = await resp.text()
      let data: any
      try { data = JSON.parse(text) } catch { data = { error: text } }

      if (data.error) {
        await supabase.from('provider_accounts').update({
          balance_checked_at: new Date().toISOString(),
          last_balance_error: typeof data.error === 'string' ? data.error : JSON.stringify(data.error),
        }).eq('id', acc.id)
        acc.last_balance_error = data.error
        continue
      }
      const balance = parseFloat(data.balance ?? '0')
      const currency = data.currency ?? acc.balance_currency ?? 'USD'
      await supabase.from('provider_accounts').update({
        balance, balance_currency: currency,
        balance_checked_at: new Date().toISOString(),
        last_balance_error: null,
      }).eq('id', acc.id)
      acc.balance = balance
      acc.balance_currency = currency
      acc.last_balance_error = null
    } catch (e: any) {
      await supabase.from('provider_accounts').update({
        balance_checked_at: new Date().toISOString(),
        last_balance_error: e?.message || 'Network error',
      }).eq('id', acc.id)
      acc.last_balance_error = e?.message || 'Network error'
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const botToken = Deno.env.get('PROVIDER_BALANCE_BOT_TOKEN')
    const chatId1 = Deno.env.get('PROVIDER_BALANCE_CHAT_ID_1')
    const chatId2 = Deno.env.get('PROVIDER_BALANCE_CHAT_ID_2')
    if (!botToken) throw new Error('PROVIDER_BALANCE_BOT_TOKEN not set')
    const chatIds = [chatId1, chatId2].filter(Boolean) as string[]
    if (chatIds.length === 0) throw new Error('No PROVIDER_BALANCE_CHAT_ID_* set')

    const usdToInr = await getUsdToInrRate()

    const { data: accounts, error } = await supabase
      .from('provider_accounts')
      .select('*')
      .eq('is_active', true)
    if (error) throw error

    await refreshBalances(accounts || [], usdToInr)

    // Sort by INR balance ascending (lowest first)
    const rows = (accounts || []).map((a: any) => {
      const currency = String(a.balance_currency ?? 'USD').toUpperCase()
      const bal = Number(a.balance ?? 0)
      const inr = currency === 'USD' ? bal * usdToInr : bal
      return { ...a, _inr: inr, _cur: currency, _bal: bal }
    }).sort((x, y) => x._inr - y._inr)

    let totalInr = 0
    const lines: string[] = []
    for (const a of rows) {
      totalInr += a._inr
      const emoji = a.last_balance_error ? '❌' : a._inr < 50 ? '⚠️' : a._inr < 200 ? '🟡' : '🟢'
      const native = a._cur === 'USD'
        ? `$${a._bal.toFixed(2)} (₹${a._inr.toFixed(0)})`
        : `₹${a._inr.toFixed(2)}`
      lines.push(`${emoji} <b>${a.name}</b> — ${native}${a.last_balance_error ? `\n   <i>err: ${String(a.last_balance_error).slice(0,80)}</i>` : ''}`)
    }

    const stamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    const msg =
      `📊 <b>Provider Balance Report</b>\n` +
      `<i>${stamp} IST</i>\n\n` +
      (lines.length ? lines.join('\n') : '<i>No active providers</i>') +
      `\n\n💰 <b>Total (approx):</b> ₹${totalInr.toFixed(0)}` +
      `\n💱 Rate: 1 USD ≈ ₹${usdToInr.toFixed(2)}`

    const sendResults = []
    for (const cid of chatIds) {
      sendResults.push({ chat_id: cid, ...(await sendTg(botToken, cid, msg)) })
    }

    return new Response(JSON.stringify({ success: true, providers: rows.length, sent: sendResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
