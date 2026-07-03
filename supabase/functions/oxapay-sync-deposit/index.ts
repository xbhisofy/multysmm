import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OXAPAY_MERCHANT_API_KEY");
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
    const { data: claims, error: cErr } = await userClient.auth.getClaims(token);
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.order_id || "").trim();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: dep } = await admin
      .from("oxapay_deposits")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (!dep) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (dep.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (dep.credited) {
      const { data: w } = await admin
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      return new Response(
        JSON.stringify({
          credited: false,
          duplicate: true,
          status: dep.status,
          new_balance: w?.balance ?? 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Query upstream by track_id
    let upstreamStatus = dep.status;
    let upstreamJson: any = null;
    if (apiKey && dep.track_id) {
      const upRes = await fetch(`https://api.oxapay.com/v1/payment/${dep.track_id}`, {
        method: "GET",
        headers: { "merchant_api_key": apiKey },
      });
      upstreamJson = await upRes.json().catch(() => ({}));
      upstreamStatus = String(
        upstreamJson?.data?.status || upstreamJson?.status || dep.status,
      ).toLowerCase();

      await admin
        .from("oxapay_deposits")
        .update({
          status: upstreamStatus,
          pay_currency:
            upstreamJson?.data?.pay_currency || upstreamJson?.pay_currency || dep.pay_currency,
          raw_payload: upstreamJson,
        })
        .eq("order_id", orderId);
    }

    if (["paid", "confirmed", "completed", "success"].includes(String(upstreamStatus).toLowerCase())) {
      const { data: creditRes, error: creditErr } = await admin.rpc("credit_wallet_oxapay", {
        p_order_id: orderId,
      });
      if (creditErr) {
        return new Response(JSON.stringify({ error: creditErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ ...creditRes, status: upstreamStatus }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: w } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        credited: false,
        duplicate: false,
        status: upstreamStatus,
        new_balance: w?.balance ?? 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("oxapay-sync-deposit error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
