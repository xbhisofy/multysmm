// Shared ZapUPI security helpers — used by zapupi-webhook + zapupi-sync-deposit.
// Layers: replay protection, gateway re-verification, amount-match guard,
// fraud-strike auto-ban, Telegram alerts.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ZAPUPI_KEY = Deno.env.get("ZAPUPI_ZAP_KEY")!;

const AMOUNT_TOLERANCE = 0.01; // ±1 paisa
const INR_RATE = 83.5;

export interface VerifyResult {
  success: boolean;
  statusStr: string;
  paid_amount: number | null;
  txn_id?: string;
  utr?: string;
  environment?: string;
  raw: unknown;
}

export async function verifyOrderWithGateway(orderId: string): Promise<VerifyResult> {
  const r = await fetch("https://pay.zapupi.com/api/order-status", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ zap_key: ZAPUPI_KEY, order_id: orderId }),
  });
  const text = await r.text();
  let data: any = {};
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  const d = data?.data ?? data;
  const statusStr = String(d?.status ?? data?.status ?? "").toLowerCase();
  const success = statusStr === "success" || statusStr === "completed" || statusStr === "paid";
  const paidRaw = d?.paid_amount ?? d?.amount_paid ?? d?.amount ?? data?.paid_amount ?? data?.amount;
  const paid_amount = paidRaw != null && paidRaw !== "" ? Number(paidRaw) : null;
  return {
    success,
    statusStr,
    paid_amount: Number.isFinite(paid_amount as number) ? (paid_amount as number) : null,
    txn_id: d?.txn_id || data?.txn_id,
    utr: d?.utr || data?.utr,
    environment: d?.environment || data?.environment,
    raw: data,
  };
}

/** Idempotency: build a stable event key and try to claim it. */
export async function claimEvent(opts: {
  admin: any;
  source: "webhook" | "sync";
  orderId: string;
  txn_id?: string;
  utr?: string;
  status: string;
  payload: unknown;
}): Promise<{ ok: true } | { ok: false; replay: true }> {
  const payloadHash = await sha256Hex(JSON.stringify(opts.payload ?? {}));
  const event_key = [
    opts.source,
    opts.orderId,
    opts.txn_id ?? "",
    opts.utr ?? "",
    opts.status,
    payloadHash,
  ].join(":");

  const { error } = await opts.admin.from("zapupi_webhook_events").insert({
    event_key,
    order_id: opts.orderId,
    txn_id: opts.txn_id ?? null,
    utr: opts.utr ?? null,
    status: opts.status,
    source: opts.source,
    payload: opts.payload ?? null,
  });
  if (error) {
    // 23505 unique_violation
    if ((error as any).code === "23505") return { ok: false, replay: true };
    throw error;
  }
  return { ok: true };
}

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Strict amount-match guard. ±0.01 tolerance. */
export function amountsMatch(expectedInr: number, paidInr: number | null): boolean {
  if (paidInr == null || !Number.isFinite(paidInr)) return false;
  return Math.abs(Number(expectedInr) - Number(paidInr)) <= AMOUNT_TOLERANCE;
}

/** Mark deposit row as failed status. */
export async function markFailed(admin: any, orderId: string, meta: unknown) {
  await admin.from("zapupi_deposits").update({
    status: "failed",
    gateway_response: meta as any,
    updated_at: new Date().toISOString(),
  }).eq("order_id", orderId);
}

/** Mark deposit row as amount-mismatch (fraud) and record strike + alert. */
export async function handleAmountMismatch(opts: {
  admin: any;
  userId: string;
  orderId: string;
  expectedInr: number;
  paidInr: number | null;
  verifyRaw: unknown;
  source: "webhook" | "sync";
}) {
  const { admin, userId, orderId, expectedInr, paidInr, verifyRaw, source } = opts;
  const mismatchMeta = {
    expected_inr: expectedInr,
    paid_inr: paidInr,
    source,
    verify: verifyRaw,
    at: new Date().toISOString(),
  };
  await admin.from("zapupi_deposits").update({
    status: "mismatch",
    mismatch_meta: mismatchMeta,
    gateway_response: { mismatch: mismatchMeta },
    updated_at: new Date().toISOString(),
  }).eq("order_id", orderId);

  const { data: strike } = await admin.rpc("record_zapupi_fraud_strike", {
    p_user_id: userId,
    p_reason_code: "amount_mismatch",
    p_meta: {
      order_id: orderId,
      expected_inr: expectedInr,
      paid_inr: paidInr,
      source,
    },
  });

  await telegramFraudAlert(admin, {
    userId,
    orderId,
    reason: "amount_mismatch",
    expectedInr,
    paidInr,
    strike,
    source,
  }).catch((e) => console.error("tg fraud alert", e));
}

/** Telegram alert for failed but not necessarily fraudulent attempts. */
export async function recordFailureStrike(opts: {
  admin: any;
  userId: string;
  orderId: string;
  source: "webhook" | "sync";
  reason: string;
}) {
  const { data: strike } = await opts.admin.rpc("record_zapupi_fraud_strike", {
    p_user_id: opts.userId,
    p_reason_code: opts.reason,
    p_meta: { order_id: opts.orderId, source: opts.source },
  });
  if (strike?.banned) {
    await telegramFraudAlert(opts.admin, {
      userId: opts.userId,
      orderId: opts.orderId,
      reason: opts.reason,
      strike,
      source: opts.source,
    }).catch((e) => console.error("tg ban alert", e));
  }
}

async function telegramFraudAlert(admin: any, p: {
  userId: string;
  orderId: string;
  reason: string;
  expectedInr?: number;
  paidInr?: number | null;
  strike?: any;
  source: "webhook" | "sync";
}) {
  const { data: prof } = await admin
    .from("profiles").select("email").eq("user_id", p.userId).maybeSingle();
  const banned = !!p.strike?.banned;
  const lines = [
    banned ? `⛔ <b>AUTO-BANNED</b>` : `🚨 <b>FRAUD STRIKE (ZapUPI)</b>`,
    ``,
    `👤 <b>User:</b> ${prof?.email ?? p.userId}`,
    `📛 <b>Reason:</b> ${p.reason}`,
    `🆔 <b>Order:</b> <code>${p.orderId}</code>`,
    `📡 <b>Source:</b> ${p.source}`,
  ];
  if (p.expectedInr != null) lines.push(`💵 <b>Expected:</b> ₹${Number(p.expectedInr).toFixed(2)}`);
  if (p.paidInr != null) lines.push(`💸 <b>Paid (gateway):</b> ₹${Number(p.paidInr).toFixed(2)}`);
  if (p.strike) {
    lines.push(
      `📊 <b>24h counts:</b> mismatch=${p.strike.mismatch_24h ?? 0}, failed=${p.strike.failed_24h ?? 0}, success=${p.strike.success_24h ?? 0}`,
    );
  }
  if (banned) lines.push(``, `🧊 <i>Wallet frozen. Manual unban required.</i>`);
  await sendTelegram(lines.join("\n"));
}

export async function telegramCreditAlert(admin: any, orderId: string, source: "webhook" | "sync") {
  const { data: dep } = await admin
    .from("zapupi_deposits")
    .select("user_id, amount_inr, txn_id, utr")
    .eq("order_id", orderId).maybeSingle();
  if (!dep) return;
  const { data: prof } = await admin
    .from("profiles").select("email").eq("user_id", dep.user_id).maybeSingle();
  const { data: wal } = await admin
    .from("wallets").select("balance").eq("user_id", dep.user_id).maybeSingle();
  const balInr = wal?.balance ? (Number(wal.balance) * INR_RATE).toFixed(2) : "?";
  const msg = [
    `💰 <b>Auto Fund Added (ZapUPI)</b>`,
    ``,
    `👤 <b>User:</b> ${prof?.email ?? dep.user_id}`,
    `💵 <b>Amount:</b> ₹${Number(dep.amount_inr).toFixed(2)}`,
    `🏦 <b>New Balance:</b> ₹${balInr}`,
    `🆔 <b>Order:</b> <code>${orderId}</code>`,
    dep.utr ? `🔁 <b>UTR:</b> <code>${dep.utr}</code>` : "",
    dep.txn_id ? `🧾 <b>Txn:</b> <code>${dep.txn_id}</code>` : "",
    `📡 <b>Source:</b> ${source}`,
  ].filter(Boolean).join("\n");
  await sendTelegram(msg);
}

async function sendTelegram(message: string) {
  await fetch(`${SUPABASE_URL}/functions/v1/send-telegram-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE}`,
    },
    body: JSON.stringify({ message, parse_mode: "HTML", force: true, alert_kind: "deposit" }),
  });
}
