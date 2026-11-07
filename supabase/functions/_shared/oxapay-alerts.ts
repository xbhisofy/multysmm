// Shared OxaPay telegram alert helper.
import { escapeTelegram } from "./telegram-routing.ts";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const INR_RATE = 83.5;

export async function telegramOxapayCreditAlert(
  admin: any,
  orderId: string,
  source: "webhook" | "sync",
) {
  try {
    const { data: dep } = await admin
      .from("oxapay_deposits")
      .select("user_id, amount_inr, amount_usd, pay_currency, track_id")
      .eq("order_id", orderId).maybeSingle();
    if (!dep) return;
    const { data: prof } = await admin
      .from("profiles").select("email, full_name").eq("user_id", dep.user_id).maybeSingle();
    const { data: wal } = await admin
      .from("wallets").select("balance").eq("user_id", dep.user_id).maybeSingle();
    const balUsd = wal?.balance != null ? Number(wal.balance).toFixed(4) : "?";
    const balInr = wal?.balance != null ? (Number(wal.balance) * INR_RATE).toFixed(2) : "?";
    const msg = [
      `💰 <b>Deposit Success</b>`,
      ``,
      `👤 <b>User:</b> ${escapeTelegram(prof?.email ?? dep.user_id)}${prof?.full_name ? ` (${escapeTelegram(prof.full_name)})` : ""}`,
      `🔑 <b>User ID:</b> <code>${escapeTelegram(dep.user_id)}</code>`,
      `💵 <b>Amount:</b> ₹${Number(dep.amount_inr).toFixed(2)} ($${Number(dep.amount_usd).toFixed(4)})`,
      `🏦 <b>New Balance:</b> $${balUsd} (≈₹${balInr})`,
      `💳 <b>Method:</b> OxaPay`,
      dep.pay_currency ? `🪙 <b>Coin:</b> ${escapeTelegram(dep.pay_currency)}` : "",
      `🆔 <b>Order:</b> <code>${escapeTelegram(orderId)}</code>`,
      dep.track_id ? `🔗 <b>Track:</b> <code>${escapeTelegram(dep.track_id)}</code>` : "",
      `📡 <b>Source:</b> ${source}`,
    ].filter(Boolean).join("\n");
    await sendTelegram(msg);
  } catch (e) {
    console.error("telegramOxapayCreditAlert failed", e);
  }
}

async function sendTelegram(message: string) {
  await fetch(`${SUPABASE_URL}/functions/v1/send-telegram-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE}`,
    },
    body: JSON.stringify({ message, parse_mode: "HTML", force: true, alert_kind: "deposit_success" }),
  });
}
