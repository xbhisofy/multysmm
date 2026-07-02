import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

async function tg(path: string, body: Record<string, unknown>) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) {
    throw new Error("Telegram connector not configured");
  }
  const res = await fetch(`${GATEWAY_URL}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return await res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authentication: require either a valid signed-in user JWT or the service-role key.
    // This blocks anonymous internet abuse of the admin Telegram channel.
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

    // Collect ALL admin chat IDs (dedupe). Sends to every configured admin.
    const rawIds = [
      Deno.env.get("TELEGRAM_CHAT_ID"),
      Deno.env.get("PROVIDER_BALANCE_CHAT_ID_1"),
      Deno.env.get("PROVIDER_BALANCE_CHAT_ID_2"),
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

    const { message, photo_url, parse_mode = "HTML" } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "No message provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.all(
      chatIds.map(async (chat_id) => {
        try {
          let r;
          if (photo_url) {
            r = await tg("sendPhoto", { chat_id, photo: photo_url, caption: message, parse_mode });
            if (!r?.ok) {
              r = await tg("sendMessage", { chat_id, text: message, parse_mode });
            }
          } else {
            r = await tg("sendMessage", { chat_id, text: message, parse_mode });
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