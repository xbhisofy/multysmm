import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const INR_RATE = 83.5;
// Only THESE admin users can manually add funds. Everyone else (admin or not) is blocked.
// Funds otherwise come exclusively from successful ZapUPI payments.
const SUPER_ADMIN_USER_IDS = new Set<string>([
  "d84c0832-ba73-42be-ad4c-5e4c5a17c157", // multysmm@gmail.com
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify the caller's JWT using an anon-key client scoped to their Authorization header.
    // (Service-role clients don't have the JWKS verifier configured after signing-key rotation,
    // which caused "Invalid token" for valid sessions.)
    const token = auth.replace("Bearer ", "");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !user) {
      console.error("auth.getUser failed:", userErr?.message);
      return json({ error: "Invalid token" }, 401);
    }


    // Admin role check
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden — admins only" }, 403);

    const body = await req.json();
    const { target_user_id, action, inr_amount, notes, transaction_id } = body ?? {};

    // 🚫 HARD BLOCK: legacy pending-deposit approvals stay disabled forever.
    if (action === "approve_pending") {
      return json({
        error: "Manual approvals are permanently disabled. Funds can only be added via ZapUPI.",
      }, 403);
    }

    // 🔒 Manual `add` and `subtract` are allowed ONLY for the super-admin (zyrofit.my).
    // All other admins are blocked from any wallet balance mutation.
    if ((action === "add" || action === "subtract") && !SUPER_ADMIN_USER_IDS.has(user.id)) {
      return json({
        error: "Only the super-admin can add or subtract funds. All other credits must come via ZapUPI.",
      }, 403);
    }

    // IP / UA (used by all branches)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ua = req.headers.get("user-agent") || "unknown";

    // ===== Branch: reject a pending deposit transaction (reject only — approve is disabled) =====
    if (action === "reject_pending") {
      if (!transaction_id) return json({ error: "transaction_id required" }, 400);

      const { data: tx, error: txFetchErr } = await admin
        .from("transactions")
        .select("id, user_id, amount, status, type, description")
        .eq("id", transaction_id)
        .maybeSingle();
      if (txFetchErr || !tx) return json({ error: "Transaction not found" }, 404);
      if (tx.status !== "pending") {
        return json({ error: `Already ${tx.status}` }, 400);
      }
      if (tx.type !== "deposit") {
        return json({ error: "Only deposit transactions can be rejected here" }, 400);
      }

      const txUsd = Number(tx.amount) || 0;
      const { data: tProfile } = await admin
        .from("profiles").select("email").eq("user_id", tx.user_id).maybeSingle();

      await admin.from("transactions").update({ status: "failed" }).eq("id", tx.id);
      await admin.from("admin_audit_log").insert({
        actor_id: user.id, actor_email: user.email,
        target_user_id: tx.user_id, target_email: tProfile?.email ?? null,
        action: "deposit_rejected", amount_usd: txUsd, amount_inr: null,
        notes: notes ?? null, ip_address: ip, user_agent: ua,
        metadata: { transaction_id: tx.id },
      });
      return json({ success: true, status: "failed" });
    }

    // ===== Branch: direct add / subtract by INR amount =====
    if (!target_user_id || (action !== "subtract" && action !== "add")) {
      return json({ error: "Invalid payload" }, 400);
    }
    const inr = Number(inr_amount);
    if (!isFinite(inr) || inr <= 0) {
      return json({ error: "Invalid amount" }, 400);
    }
    const usd = Math.trunc((inr / INR_RATE) * 10000) / 10000;

    // Fetch target email (for audit/Telegram)
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("email")
      .eq("user_id", target_user_id)
      .maybeSingle();

    // Atomic adjust: wallet update + transaction insert in a single DB transaction
    const { data: rpcData, error: rpcErr } = await admin.rpc("admin_adjust_wallet", {
      p_target_user_id: target_user_id,
      p_action: action,
      p_usd: usd,
      p_inr: inr,
      p_notes: notes ?? null,
    });
    if (rpcErr) throw rpcErr;
    const newBalance = Number((rpcData as any)?.new_balance ?? 0);
    const isAdd = action === "add";


    // Audit log — never let logging failure block the action result
    await admin.from("admin_audit_log").insert({
      actor_id: user.id,
      actor_email: user.email,
      target_user_id,
      target_email: targetProfile?.email ?? null,
      action: isAdd ? "wallet_credit_manual" : "wallet_withdraw",
      amount_usd: usd,
      amount_inr: inr,
      notes: notes ?? null,
      ip_address: ip,
      user_agent: ua,
      metadata: { new_balance: newBalance },
    });

    // Real-time Telegram alert (non-blocking)
    try {
      const balInr = (newBalance * INR_RATE).toFixed(2);
      const msg = [
        isAdd ? `🟢 <b>Manual Fund Added (Admin)</b>` : `🔴 <b>Manual Withdrawal (Admin)</b>`,
        ``,
        `👤 <b>User:</b> ${targetProfile?.email ?? target_user_id}`,
        `💵 <b>Amount:</b> ₹${inr.toFixed(2)}`,
        `🏦 <b>New Balance:</b> ₹${balInr}`,
        `🛡️ <b>Admin:</b> ${user.email ?? user.id}`,
        notes ? `📝 <b>Notes:</b> ${notes}` : '',
      ].filter(Boolean).join('\n');
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-telegram-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ message: msg, parse_mode: "HTML", force: true, alert_kind: "deposit_admin" }),
      });
    } catch (e) {
      console.error("tg notify failed", e);
    }

    return json({ success: true, new_balance: newBalance });
  } catch (e: any) {
    console.error("admin-wallet-action error", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }

  function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});