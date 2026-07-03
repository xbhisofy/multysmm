import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cooldown per alert-kind (resets on cold start)
const lastSent: Record<string, number> = {};
const COOLDOWN_MS = 65 * 60 * 1000; // 65 minutes between similar alerts

// If message body contains any of these keywords, treat as low-priority and rate-limit.
// Critical (system down, DB error, edge crash) messages bypass this filter.
const LOW_PRIORITY_KEYWORDS = [
  "low balance",
  "balance low",
  "provider balance",
  "top up",
  "top-up",
  "topup needed",
  "order stuck",
  "pending order",
  "stuck run",
  "cron warning",
  "partial failure",
];
const CRITICAL_KEYWORDS = ["system down", "database error", "edge function crash", "critical"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });


  try {
    // Auth: signed-in user OR service-role key
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    let authorized = !!token && !!serviceKey && token === serviceKey;
    if (!authorized && token) {
      try {
        const supa = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        );
        const { data, error } = await supa.auth.getUser(token);
        authorized = !error && !!data?.user;
      } catch (_) {
        authorized = false;
      }
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BOT_TOKEN = Deno.env.get("PROVIDER_BALANCE_BOT_TOKEN");
    if (!BOT_TOKEN) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "PROVIDER_BALANCE_BOT_TOKEN not set" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rawIds = [
      Deno.env.get("PROVIDER_BALANCE_CHAT_ID_1"),
      Deno.env.get("PROVIDER_BALANCE_CHAT_ID_2"),
      Deno.env.get("TELEGRAM_CHAT_ID"),
    ];
    const chatIds = Array.from(
      new Set(
        rawIds
          .flatMap((v) => (v ? v.split(",") : []))
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    );

    if (chatIds.length === 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "No admin chat IDs configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { message, photo_url, parse_mode = "HTML", alert_kind, force } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "No message provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Priority filter — suppress noisy warnings unless critical / forced
    const lower = String(message).toLowerCase();
    const isCritical = force === true || CRITICAL_KEYWORDS.some((k) => lower.includes(k));
    const isLowPriority = !isCritical && LOW_PRIORITY_KEYWORDS.some((k) => lower.includes(k));

    if (isLowPriority) {
      const key = alert_kind || LOW_PRIORITY_KEYWORDS.find((k) => lower.includes(k)) || "low";
      const last = lastSent[key] || 0;
      const now = Date.now();
      if (now - last < COOLDOWN_MS) {
        return new Response(
          JSON.stringify({
            skipped: true,
            reason: "cooldown_active",
            alert_kind: key,
            remaining_seconds: Math.round((COOLDOWN_MS - (now - last)) / 1000),
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      lastSent[key] = now;
    }

    const api = (method: string, body: Record<string, unknown>) =>
      fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json());

    const results = await Promise.all(
      chatIds.map(async (chat_id) => {
        try {
          let r;
          if (photo_url) {
            r = await api("sendPhoto", { chat_id, photo: photo_url, caption: message, parse_mode });
            if (!r?.ok) {
              r = await api("sendMessage", { chat_id, text: message, parse_mode });
            }
          } else {
            r = await api("sendMessage", { chat_id, text: message, parse_mode });
          }
          return { chat_id, ok: !!r?.ok, error: r?.description ?? null };
        } catch (e) {
          return { chat_id, ok: false, error: String(e) };
        }
      }),
    );

    return new Response(JSON.stringify({ ok: true, sent: results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
