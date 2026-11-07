import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateProviderTopupReport } from '../_shared/provider-topup-report.ts';
import { fundBotCommand, isFundAdminChat, withDeadline } from '../_shared/fund-bot-policy.ts';

const token = Deno.env.get('FUND_ALERT_BOT_TOKEN') ?? '';
const chats = Deno.env.get('FUND_ALERT_CHAT_ID') ?? '';
const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const keyboard = {
  keyboard: [[{ text: '💰 Live Balance' }, { text: '📊 Top-up Plan' }], [{ text: '🏠 Menu' }]],
  resize_keyboard: true, is_persistent: true,
};
const escape = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inr = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v);

async function send(chatId: string | number, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup: keyboard, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error('Telegram delivery failed');
}

async function process(chatId: string | number, command: ReturnType<typeof fundBotCommand>) {
  try {
    if (command === 'menu') {
      await send(chatId, '🌿 <b>MultySMM Admin Desk</b>\n━━━━━━━━━━━━━━━━━━\n💰 Live provider balances\n📊 Verified unsent-work top-up plan\n🔔 ZapUPI / OxaPay payment alerts\n\nNeeche button tap karein 👇');
      return;
    }
    await send(chatId, '⏳ <b>Live provider check chal raha hai…</b>');
    const report = await withDeadline(generateProviderTopupReport(db), 40000);
    const lines = report.providers.map((p: any) => {
      const incomplete = p.balance_unknown || p.unknown_runs > 0;
      const nativeBalance = p.balance_unknown ? 'Unavailable ⚠️' : inr(p.balance_inr);
      const title = `${incomplete ? '⚠️' : '🟢'} <b>${escape(p.provider_name)}</b>\n💰 Balance: <b>${nativeBalance}</b>`;
      return command === 'balance' ? title : `${title}\n📦 Unsent runs: ${p.pending_runs}\n💸 Verified cost: ${inr(p.cost_inr)}\n➕ Top-up: <b>${incomplete ? 'Incomplete — verify provider' : inr(Math.max(0, p.cost_inr - p.balance_inr))}</b>${p.unknown_runs ? `\n❓ Unpriced runs: ${p.unknown_runs}` : ''}`;
    });
    const incomplete = report.providers.some((p: any) => p.balance_unknown || p.unknown_runs > 0);
    const total = report.providers.reduce((sum: number, p: any) => sum + (command === 'balance' ? p.balance_inr : Math.max(0, p.cost_inr - p.balance_inr)), 0);
    const heading = command === 'balance' ? '💰 <b>Live Provider Balances</b>' : '📊 <b>Provider Top-up Plan</b>';
    const stamp = new Date(report.generated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const footer = `\n━━━━━━━━━━━━━━━━━━\n${command === 'balance' ? 'Verified balance total' : 'Required top-up'}: <b>${command === 'plan' && incomplete ? 'Incomplete' : inr(total)}</b>${incomplete ? '\n⚠️ Unavailable providers ko zero balance nahi maana gaya. Incomplete plan par top-up na karein.' : ''}\n🕒 ${stamp} IST\n<a href="https://multysmm.com/admin/topup-plan">Website par full report ↗</a>`;
    let chunk = `${heading}\n━━━━━━━━━━━━━━━━━━\n`;
    for (const line of lines) {
      if (chunk.length + line.length > 3200) { await send(chatId, chunk); chunk = ''; }
      chunk += line + '\n\n';
    }
    await send(chatId, chunk + footer);
  } catch {
    await send(chatId, '⚠️ <b>Report abhi load nahi hui.</b>\nThodi der baad button se dobara check karein. Koi wallet ya order change nahi hua.');
  }
}

Deno.serve(async req => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!token) return new Response('Unauthorized', { status: 401 });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`telegram-webhook:${token}`));
  const secret = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const supplied = req.headers.get('x-telegram-bot-api-secret-token') ?? '';
  let difference = supplied.length ^ secret.length;
  for (let i = 0; i < secret.length; i++) difference |= secret.charCodeAt(i) ^ (supplied.charCodeAt(i) || 0);
  if (difference !== 0) return new Response('Unauthorized', { status: 401 });
  const update = await req.json().catch(() => null);
  if (!update || !Number.isInteger(update.update_id)) return new Response('Invalid update', { status: 400 });
  const message = update.message;
  if (!message || !isFundAdminChat(message.chat?.id, chats) || typeof message.text !== 'string') return Response.json({ ok: true, ignored: true });
  // Claim each Telegram update once across worker restarts before sending anything.
  const { data: claimed, error } = await db.from('fund_bot_updates').upsert({
    update_id: update.update_id,
  }, { onConflict: 'update_id', ignoreDuplicates: true }).select('update_id');
  if (error) return Response.json({ error: 'Unable to accept update' }, { status: 503 });
  if (!claimed?.length) return Response.json({ ok: true, duplicate: true });
  EdgeRuntime.waitUntil(process(message.chat.id, fundBotCommand(message.text)));
  return Response.json({ ok: true });
});