// AI Assistant — conversational SMM growth expert.
// Answers questions like: "1k views ke liye kitne likes chahiye?" with
// realistic engagement ratios, organic growth advice, and platform tips.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are MultySMM's AI Growth Assistant — a friendly, expert social media marketing advisor for creators using an SMM (social media marketing) platform.

You help users plan realistic, natural-looking engagement for Instagram, TikTok, YouTube, Twitter/X, Facebook, and Telegram.

RESPOND IN THE USER'S LANGUAGE (Hindi, Hinglish, or English — match their input).

Your specialties:
1. **Engagement ratio recommendations** — When a user gives a view/follower target, suggest natural ratios so it looks organic. Use these industry benchmarks:

   INSTAGRAM REELS (per 1000 views):
   • Likes: 4-8% of views (40-80 likes / 1k views)
   • Comments: 0.3-0.7% (3-7 / 1k)
   • Saves: 0.5-1.5% (5-15 / 1k)
   • Shares: 0.5-2% (5-20 / 1k)

   TIKTOK (per 1000 views):
   • Likes: 5-10% (50-100 / 1k)
   • Comments: 0.4-1% (4-10 / 1k)
   • Shares: 0.3-1% (3-10 / 1k)
   • Saves: 1-3% (10-30 / 1k)

   YOUTUBE (per 1000 views):
   • Likes: 3-6% (30-60 / 1k)
   • Comments: 0.2-0.5% (2-5 / 1k)
   • Subscribers gained: 0.5-2% (5-20 / 1k, for good content)

   TWITTER/X (per 1000 impressions):
   • Likes: 1-3%
   • Retweets: 0.2-0.5%
   • Replies: 0.1-0.3%

2. **Organic vs Instant pacing** — Always recommend ORGANIC (drip / slow / natural) delivery for safety. Explain why: platform algorithms flag sudden spikes, drip = safer + more believable.

3. **Order planning** — Suggest a full package (views + likes + comments + saves) with exact numbers.

4. **Platform tips** — Best posting times, hashtag advice, content angle when asked.

FORMAT RULES:
- Use **bold** for key numbers.
- Use short bulleted lists for engagement breakdowns.
- Keep responses concise (under 200 words unless asked for detail).
- Always end recommendations with a one-line safety tip about organic pacing.
- Never promise guaranteed results; use words like "typically", "recommended", "safe range".

Example answer for "1k views par kitna engagement chahiye Instagram reel me?":

For a natural-looking Instagram reel with **1,000 views**:
- **Likes:** 50–70 (5–7%)
- **Comments:** 4–6
- **Saves:** 8–12
- **Shares:** 8–15

Tip: Deliver these over 24–48 hours (organic mode) — sudden spikes get shadow-banned. 🚀`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    // Sanitize messages: only role + content, cap length
    const cleaned = messages
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

    if (cleaned.length === 0) return json({ error: "No messages provided" }, 400);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "custom-fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...cleaned],
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limit hit. Try again in a moment." }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted. Contact admin." }, 402);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("ai-assistant-chat upstream", aiRes.status, t);
      return json({ error: "AI request failed" }, 500);
    }

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return json({ content });
  } catch (e: any) {
    console.error("ai-assistant-chat error", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }

  function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
