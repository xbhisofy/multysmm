import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Simulate calling send-telegram-notification the same way admin-wallet-action does
  const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-telegram-notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({
      message: `🟢 <b>Test — Fund Add Alert</b>\n\n👤 <b>User:</b> test@user.com\n💵 <b>Amount:</b> ₹100.00\n🏦 <b>New Balance:</b> ₹500.00\n🛡️ <b>Admin:</b> multysmm@gmail.com`,
      parse_mode: 'HTML',
    }),
  });
  const body = await r.json();
  return new Response(JSON.stringify({ status: r.status, body }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
