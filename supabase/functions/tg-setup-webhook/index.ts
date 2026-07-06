import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (_req) => {
  const BOT = Deno.env.get('PROVIDER_BALANCE_BOT_TOKEN') ?? ''
  const SECRET = Deno.env.get('TG_WEBHOOK_SECRET') ?? ''
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-bot-webhook`

  const setRes = await fetch(`https://api.telegram.org/bot${BOT}/setWebhook`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      url, secret_token: SECRET,
      allowed_updates: ['message'],
      drop_pending_updates: true,
    }),
  }).then(r => r.json())

  const cmds = await fetch(`https://api.telegram.org/bot${BOT}/setMyCommands`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      commands: [
        { command: 'bal', description: 'Live provider balances' },
        { command: 'help', description: 'Show help' },
      ],
    }),
  }).then(r => r.json())

  const info = await fetch(`https://api.telegram.org/bot${BOT}/getWebhookInfo`).then(r=>r.json())

  return new Response(JSON.stringify({ webhookUrl: url, setRes, cmds, info }, null, 2), {
    headers: {'Content-Type':'application/json'},
  })
})
