import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token',
}

const BOT_TOKEN = Deno.env.get('PROVIDER_BALANCE_BOT_TOKEN') ?? ''
const WEBHOOK_SECRET = Deno.env.get('TG_WEBHOOK_SECRET') ?? ''
const ALLOWED_CHATS = [
  Deno.env.get('PROVIDER_BALANCE_CHAT_ID_1'),
  Deno.env.get('PROVIDER_BALANCE_CHAT_ID_2'),
  Deno.env.get('PROVIDER_BALANCE_CHAT_ID_3'),
  Deno.env.get('TELEGRAM_CHAT_ID'),
].flatMap(v => (v ? v.split(',') : [])).map(s => s.trim()).filter(Boolean)

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

async function fetchLiveBalance(acc: any) {
  try {
    const fd = new URLSearchParams()
    fd.append('key', acc.api_key)
    fd.append('action', 'balance')
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 10000)
    const r = await fetch(acc.api_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: fd.toString(),
      signal: ctrl.signal,
    })
    clearTimeout(t)
    const text = await r.text()
    let data: any
    try { data = JSON.parse(text) } catch { data = { error: text } }
    if (data.error) {
      await supabase.from('provider_accounts').update({
        balance_checked_at: new Date().toISOString(),
        last_balance_error: typeof data.error === 'string' ? data.error : JSON.stringify(data.error),
      }).eq('id', acc.id)
      return { ...acc, _err: String(data.error) }
    }
    const balance = parseFloat(data.balance ?? '0')
    const currency = data.currency ?? acc.balance_currency ?? 'USD'
    await supabase.from('provider_accounts').update({
      balance, balance_currency: currency,
      balance_checked_at: new Date().toISOString(),
      last_balance_error: null,
    }).eq('id', acc.id)
    return { ...acc, balance, balance_currency: currency, _err: null }
  } catch (e: any) {
    return { ...acc, _err: e?.message || 'Network error' }
  }
}

async function sendTg(chatId: string | number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  })
}

async function buildBalanceReport(): Promise<string> {
  const usdToInr = await getUsdToInrRate()
  const { data: accounts } = await supabase
    .from('provider_accounts').select('*').eq('is_active', true)

  const refreshed = await Promise.all((accounts || []).map(fetchLiveBalance))

  const rows = refreshed.map((a: any) => {
    const cur = String(a.balance_currency ?? 'USD').toUpperCase()
    const bal = Number(a.balance ?? 0)
    const inr = cur === 'USD' ? bal * usdToInr : bal
    return { ...a, _inr: inr, _cur: cur, _bal: bal }
  }).sort((x: any, y: any) => x._inr - y._inr)

  let total = 0
  const lines: string[] = []
  for (const a of rows) {
    if (!a._err) total += a._inr
    const emoji = a._err ? '❌' : a._inr < 50 ? '🚨' : a._inr < 200 ? '🟡' : '🟢'
    const native = a._err
      ? `<i>error: ${String(a._err).slice(0, 80)}</i>`
      : a._cur === 'USD'
        ? `<b>₹${a._inr.toFixed(0)}</b> <i>($${a._bal.toFixed(2)})</i>`
        : `<b>₹${a._inr.toFixed(2)}</b>`
    lines.push(`${emoji} <b>${a.name}</b>\n   └ ${native}`)
  }

  const stamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  return (
    `💰 <b>Provider Live Balance</b>\n` +
    `<i>${stamp} IST</i>\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    (lines.length ? lines.join('\n\n') : '<i>No active providers</i>') +
    `\n━━━━━━━━━━━━━━━━━━━\n` +
    `💵 <b>Total:</b> ₹${total.toFixed(0)}\n` +
    `💱 Rate: 1 USD ≈ ₹${usdToInr.toFixed(2)}`
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Verify secret if configured
    if (WEBHOOK_SECRET) {
      const got = req.headers.get('x-telegram-bot-api-secret-token')
      if (got !== WEBHOOK_SECRET) {
        return new Response('Unauthorized', { status: 401 })
      }
    }

    const update = await req.json().catch(() => ({}))
    const msg = update?.message ?? update?.edited_message
    const chatId = msg?.chat?.id
    const text = String(msg?.text ?? '').trim().toLowerCase()

    if (!chatId || !text) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Restrict to allowed chats
    if (ALLOWED_CHATS.length && !ALLOWED_CHATS.includes(String(chatId))) {
      await sendTg(chatId, '⛔ <b>Unauthorized.</b> This bot is private.')
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const cmd = text.split(/[\s@]/)[0]

    if (cmd === '/start' || cmd === '/help') {
      await sendTg(chatId,
        `👋 <b>Provider Balance Bot</b>\n\n` +
        `<b>Commands:</b>\n` +
        `/bal — Live balance of all providers\n` +
        `/help — Show this help\n\n` +
        `⏰ Auto report every 3 hours\n` +
        `🚨 Low balance alert &lt; ₹50`
      )
    } else if (cmd === '/bal' || cmd === '/balance') {
      await sendTg(chatId, '⏳ <i>Fetching live balances...</i>')
      const report = await buildBalanceReport()
      await sendTg(chatId, report)
    } else {
      await sendTg(chatId, `❓ Unknown command. Try /bal or /help`)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    console.error('bot webhook error:', e?.message)
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
