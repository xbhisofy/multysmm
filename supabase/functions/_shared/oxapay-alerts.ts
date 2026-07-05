// Shared OxaPay telegram alert helper.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INR_RATE = 90;

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
      .from("profiles").select("email").eq("user_id", dep.user_id).maybeSingle();
    const { data: wal } = await admin
      .from("wallets").select("balance").eq("user_id", dep.user_id).maybeSingle();
    const balUsd = wal?.balance ? Number(wal.balance).toFixed(4) : "?";
    const balInr = wal?.balance ? (Number(wal.balance) * INR_RATE).toFixed(2) : "?";
    const msg = [
      `💰 <b>Auto Fund Added (OxaPay Crypto)</b>`,
      ``,
      `👤 <b>User:</b> ${prof?.email ?? dep.user_id}`,
      `💵 <b>Amount:</b> ₹${Number(dep.amount_inr).toFixed(2)} ($${Number(dep.amount_usd).toFixed(4)})`,
      `🏦 <b>New Balance:</b> $${balUsd} (≈₹${balInr})`,
      dep.pay_currency ? `🪙 <b>Coin:</b> ${dep.pay_currency}` : "",
      `🆔 <b>Order:</b> <code>${orderId}</code>`,
      dep.track_id ? `🔗 <b>Track:</b> <code>${dep.track_id}</code>` : "",
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
    body: JSON.stringify({ message, parse_mode: "HTML", force: true }),
  });
}
