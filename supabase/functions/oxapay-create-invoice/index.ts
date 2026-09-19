import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RATE = 90; // ₹90 = $1
const MIN_INR = 90;
const MAX_INR = 540000;

const ALLOWED_ORIGINS = [
  "https://multysmm.com",
  "https://www.multysmm.com",
  "https://multitsmmm.lovable.app",
];

function safeOrigin(input?: string): string {
  const fallback = "https://multysmm.com";
  if (!input) return fallback;
  try {
    const u = new URL(input);
    const host = u.hostname;
    if (
      ALLOWED_ORIGINS.includes(u.origin) ||
      host.endsWith(".lovable.app") ||
      host.endsWith(".lovableproject.com") ||
      host === "localhost" ||
      host === "127.0.0.1"
    ) {
      return u.origin;
    }
  } catch (_) {}
  return fallback;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OXAPAY_MERCHANT_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OxaPay not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const email = (claimsData.claims.email as string) || "user@multysmm.com";

    const body = await req.json().catch(() => ({}));
    const amountInr = Number(body?.amount_inr);
    const returnOrigin = safeOrigin(body?.return_origin);

    if (!Number.isFinite(amountInr) || amountInr < MIN_INR || amountInr > MAX_INR) {
      return new Response(
        JSON.stringify({ error: `Amount must be between ₹${MIN_INR} and ₹${MAX_INR}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Ban check
    const { data: profile } = await admin
      .from("profiles")
      .select("is_banned")
      .eq("user_id", userId)
      .maybeSingle();
    if (profile?.is_banned) {
      return new Response(JSON.stringify({ error: "Account suspended" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountInrRounded = Math.round(amountInr * 100) / 100;
    const amountUsd = Math.round((amountInrRounded / RATE) * 10000) / 10000;
    const orderId = `OXP_${crypto.randomUUID()}`;

    const { error: insErr } = await admin.from("oxapay_deposits").insert({
      user_id: userId,
      order_id: orderId,
      amount_usd: amountUsd,
      amount_inr: amountInrRounded,
      status: "waiting",
    });
    if (insErr) throw insErr;

    const returnUrl = `${returnOrigin}/wallet?oxapay=success&oxapay_order_id=${orderId}`;
    // Callback must be publicly reachable (OxaPay servers call it).
    const publicBase = Deno.env.get("PUBLIC_FUNCTIONS_URL") || `${supabaseUrl}/functions/v1`;
    const callbackUrl = `${publicBase}/oxapay-webhook`;

    const payload = {
      amount: amountUsd,
      currency: "USD",
      lifetime: 30,
      fee_paid_by_payer: 1,
      under_paid_coverage: 0,
      order_id: orderId,
      email,
      description: `Wallet top-up ₹${amountInrRounded} ($${amountUsd})`,
      return_url: returnUrl,
      callback_url: callbackUrl,
    };

    const oxRes = await fetch("https://api.oxapay.com/v1/payment/invoice", {
      method: "POST",
      headers: {
        "merchant_api_key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const oxJson = await oxRes.json().catch(() => ({}));
    const paymentUrl = oxJson?.data?.payment_url;
    const trackId = oxJson?.data?.track_id;

    if (!oxRes.ok || !paymentUrl) {
      await admin
        .from("oxapay_deposits")
        .update({ status: "failed", raw_payload: oxJson })
        .eq("order_id", orderId);
      return new Response(
        JSON.stringify({ error: "Failed to create OxaPay invoice", details: oxJson }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await admin
      .from("oxapay_deposits")
      .update({
        track_id: trackId ? String(trackId) : null,
        payment_url: paymentUrl,
        raw_payload: oxJson,
      })
      .eq("order_id", orderId);

    return new Response(
      JSON.stringify({
        order_id: orderId,
        payment_url: paymentUrl,
        track_id: trackId,
        amount_usd: amountUsd,
        amount_inr: amountInrRounded,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("oxapay-create-invoice error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
