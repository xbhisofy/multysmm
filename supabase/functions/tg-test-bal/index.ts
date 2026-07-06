import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (_req) => {
  const SECRET = Deno.env.get('TG_WEBHOOK_SECRET') ?? ''
  const chatId = Deno.env.get('PROVIDER_BALANCE_CHAT_ID_1') || Deno.env.get('TELEGRAM_CHAT_ID')
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-bot-webhook`

  const fakeUpdate = {
    update_id: Date.now(),
    message: {
      message_id: 1,
      date: Math.floor(Date.now() / 1000),
      chat: { id: Number(chatId), type: 'private' },
      from: { id: Number(chatId), is_bot: false, first_name: 'Test' },
      text: '/bal',
    },
  }

  const t0 = Date.now()
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-bot-api-secret-token': SECRET,
    },
    body: JSON.stringify(fakeUpdate),
  })
  const body = await r.text()
  return new Response(JSON.stringify({
    status: r.status, body, elapsed_ms: Date.now() - t0, chatId,
  }, null, 2), { headers: {'Content-Type':'application/json'} })
})
