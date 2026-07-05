import { createClient } from "npm:@supabase/supabase-js@2";
import { telegramOxapayCreditAlert } from "../_shared/oxapay-alerts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Map raw DB/RPC errors to stable, user-safe codes + messages.
function classifyError(msg: string): { code: string; userMessage: string; retryable: boolean } {
  const m = (msg || "").toLowerCase();
  if (m.includes("currency mismatch")) {
    return {
      code: "CURRENCY_MISMATCH",
      userMessage: "Payment amount does not match invoice. Please contact support.",
      retryable: false,
    };
  }
  if (m.includes("deposit order not found")) {
    return { code: "NOT_FOUND", userMessage: "Deposit not found.", retryable: false };
  }
  if (m.includes("deposit not in payable status")) {
    return {
      code: "PENDING_CONFIRMATION",
      userMessage: "Payment still awaiting network confirmation.",
      retryable: true,
    };
  }
  if (m.includes("wallet not found")) {
    return { code: "WALLET_MISSING", userMessage: "Wallet not initialised. Please refresh and retry.", retryable: true };
  }
  return { code: "UNKNOWN", userMessage: msg || "Could not verify payment.", retryable: true };
}

async function creditWithRetry(admin: any, orderId: string) {
  const delays = [0, 800, 2000];
  let lastErr: any = null;
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) await sleep(delays[i]);
    const { data, error } = await admin.rpc("credit_wallet_oxapay", { p_order_id: orderId });
    if (!error) return { ok: true, data };
    lastErr = error;
    const msg = String(error?.message ?? "");
    // Non-retryable: bail immediately
    if (
      msg.includes("Deposit order not found") ||
      msg.includes("currency mismatch") ||
      msg.includes("Deposit not in payable status")
    ) {
      return { ok: false, error: msg };
    }
  }
  return { ok: false, error: String(lastErr?.message ?? lastErr) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("OXAPAY_MERCHANT_API_KEY");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }), {
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
      return new Response(JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.order_id || "").trim();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "order_id required", code: "BAD_REQUEST" }), {
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
      return new Response(
        JSON.stringify({ error: "Order not found", code: "NOT_FOUND", user_message: "Deposit not found. If you paid, please contact support." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (dep.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden", code: "FORBIDDEN" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (dep.credited) {
      const { data: w } = await admin.from("wallets").select("balance").eq("user_id", userId).maybeSingle();
      return new Response(
        JSON.stringify({
          credited: false,
          duplicate: true,
          status: dep.status,
          new_balance: w?.balance ?? 0,
          user_message: "Already credited to your wallet.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Query upstream by track_id (retry once on transient network error)
    let upstreamStatus = dep.status;
    let upstreamJson: any = null;
    if (apiKey && dep.track_id) {
      for (let i = 0; i < 2; i++) {
        try {
          const upRes = await fetch(`https://api.oxapay.com/v1/payment/${dep.track_id}`, {
            method: "GET",
            headers: { "merchant_api_key": apiKey },
          });
          upstreamJson = await upRes.json().catch(() => ({}));
          upstreamStatus = String(
            upstreamJson?.data?.status || upstreamJson?.status || dep.status,
          ).toLowerCase();
          break;
        } catch (e) {
          if (i === 1) console.error("oxapay upstream fetch failed", e);
          else await sleep(600);
        }
      }

      if (upstreamJson) {
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
    }

    if (["paid", "confirmed", "completed", "success"].includes(String(upstreamStatus).toLowerCase())) {
      const result = await creditWithRetry(admin, orderId);
      if (!result.ok) {
        const cls = classifyError(result.error || "");
        return new Response(
          JSON.stringify({
            error: result.error,
            code: cls.code,
            user_message: cls.userMessage,
            retryable: cls.retryable,
            status: upstreamStatus,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          ...result.data,
          status: upstreamStatus,
          user_message: "Crypto payment received — wallet credited.",
        }),
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
        user_message:
          upstreamStatus === "waiting" || upstreamStatus === "new"
            ? "Waiting for you to complete payment in OxaPay."
            : upstreamStatus === "expired"
            ? "This invoice has expired. Please create a new one."
            : "Payment still awaiting network confirmation. This can take a few minutes.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("oxapay-sync-deposit error", e);
    return new Response(
      JSON.stringify({ error: String(e?.message ?? e), code: "SERVER_ERROR", retryable: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
