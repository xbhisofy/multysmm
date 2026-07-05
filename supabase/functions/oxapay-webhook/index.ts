import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function hmacSha512Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Retry credit RPC with exponential backoff on transient errors only.
// Idempotent: credit_wallet_oxapay returns `duplicate:true` if already credited.
async function creditWithRetry(admin: any, orderId: string) {
  const delays = [0, 1500, 4000, 9000]; // up to 4 tries (~14.5s)
  const attempts: Array<{ attempt: number; ok: boolean; error?: string }> = [];
  let lastErr: any = null;
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) await sleep(delays[i]);
    try {
      const { data, error } = await admin.rpc("credit_wallet_oxapay", { p_order_id: orderId });
      if (error) throw error;
      attempts.push({ attempt: i + 1, ok: true });
      return { ok: true, data, attempts };
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message ?? e ?? "");
      attempts.push({ attempt: i + 1, ok: false, error: msg });
      // Non-retryable business errors — bail immediately
      if (
        msg.includes("Deposit order not found") ||
        msg.includes("currency mismatch") ||
        msg.includes("Deposit not in payable status")
      ) {
        return { ok: false, error: msg, attempts };
      }
    }
  }
  return { ok: false, error: String(lastErr?.message ?? lastErr ?? "unknown"), attempts };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiKey = Deno.env.get("OXAPAY_MERCHANT_API_KEY") || "";
  const admin = createClient(supabaseUrl, serviceKey);

  const rawBody = await req.text();
  const hmacHeader = req.headers.get("hmac") || req.headers.get("HMAC") || "";

  let payload: any = {};
  try {
    payload = JSON.parse(rawBody);
  } catch (_) {}

  const orderId = payload?.order_id || payload?.data?.order_id || null;
  const trackId = payload?.track_id || payload?.data?.track_id || null;
  const status = String(payload?.status || payload?.data?.status || "").toLowerCase();

  let hmacValid = false;
  if (apiKey && hmacHeader) {
    try {
      const computed = await hmacSha512Hex(apiKey, rawBody);
      hmacValid = computed.toLowerCase() === hmacHeader.toLowerCase();
    } catch (_) {}
  }

  const headersObj: Record<string, string> = {};
  req.headers.forEach((v, k) => (headersObj[k] = v));

  const { data: logRow } = await admin
    .from("oxapay_webhook_events")
    .insert({
      order_id: orderId,
      track_id: trackId,
      hmac_valid: hmacValid,
      headers: headersObj,
      raw_payload: payload,
    })
    .select("id")
    .single();

  const logId = logRow?.id;

  // Always ACK OxaPay so it doesn't hammer retries; we handle our own retries here.
  const okResp = () =>
    new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (!hmacValid) {
    if (logId) {
      await admin
        .from("oxapay_webhook_events")
        .update({ error_message: "invalid hmac" })
        .eq("id", logId);
    }
    return okResp();
  }

  if (!orderId) return okResp();

  // Update deposit row (best-effort, retry once on failure)
  for (let i = 0; i < 2; i++) {
    try {
      await admin
        .from("oxapay_deposits")
        .update({
          status: status || "waiting",
          pay_currency: payload?.pay_currency || payload?.data?.pay_currency || null,
          raw_payload: payload,
          track_id: trackId ? String(trackId) : undefined,
        })
        .eq("order_id", orderId);
      break;
    } catch (e) {
      if (i === 1) console.error("update deposit failed", e);
      else await sleep(500);
    }
  }

  if (["paid", "confirmed", "completed", "success"].includes(status)) {
    const result = await creditWithRetry(admin, orderId);
    if (logId) {
      await admin
        .from("oxapay_webhook_events")
        .update({
          processed: result.ok,
          error_message: result.ok
            ? null
            : `credit failed after ${result.attempts.length} attempts: ${result.error}`,
        })
        .eq("id", logId);
    }
    if (result.ok) {
      console.log("oxapay credited", orderId, result.data);
    } else {
      console.error("oxapay credit permanently failed", orderId, result.error, result.attempts);
    }
  }

  return okResp();
});
