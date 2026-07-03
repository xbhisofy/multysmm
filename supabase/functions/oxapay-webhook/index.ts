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

  // Update deposit row
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
  } catch (e) {
    console.error("update deposit failed", e);
  }

  if (["paid", "confirmed", "completed", "success"].includes(status)) {
    try {
      const { data: creditRes, error: creditErr } = await admin.rpc("credit_wallet_oxapay", {
        p_order_id: orderId,
      });
      if (creditErr) throw creditErr;
      if (logId) {
        await admin
          .from("oxapay_webhook_events")
          .update({ processed: true })
          .eq("id", logId);
      }
      console.log("oxapay credited", orderId, creditRes);
    } catch (e) {
      console.error("credit failed", orderId, e);
      if (logId) {
        await admin
          .from("oxapay_webhook_events")
          .update({ error_message: String(e?.message ?? e) })
          .eq("id", logId);
      }
    }
  }

  return okResp();
});
