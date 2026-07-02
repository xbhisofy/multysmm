import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const token = Deno.env.get('PROVIDER_BALANCE_BOT_TOKEN')!;
  const chats = [
    Deno.env.get('PROVIDER_BALANCE_CHAT_ID_1'),
    Deno.env.get('PROVIDER_BALANCE_CHAT_ID_2'),
  ].filter(Boolean) as string[];

  const text = `🎉 <b>MultySMM Bot Test</b>\n\n✅ Bot successfully connected!\nAap dono admins ko ab har 6 ghante me provider balance ka auto-report milega.\n\n<i>— MultySMM System</i>`;

  const results: any[] = [];
  for (const chat_id of chats) {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
    });
    const j = await r.json();
    results.push({ chat_id, ok: j.ok, error: j.description ?? null });
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
