// AI Growth Engine — parses a natural-language growth request into a
// structured engagement config that the EngagementOrder page can prefill.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const KNOWN_TYPES = [
  "views", "likes", "comments", "saves", "shares",
  "reposts", "followers", "subscribers", "watch_hours", "retweets",
];
const KNOWN_PLATFORMS = [
  "instagram", "youtube", "tiktok", "twitter", "facebook", "telegram",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json({ error: "AI not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt ?? "").trim();
    const availablePlatforms: string[] = Array.isArray(body?.availablePlatforms)
      ? body.availablePlatforms.filter((p: any) => typeof p === "string")
      : KNOWN_PLATFORMS;
    const selectedPlatform: string = typeof body?.selectedPlatform === "string"
      ? body.selectedPlatform
      : (availablePlatforms[0] ?? "instagram");

    if (!prompt || prompt.length < 3) {
      return json({ error: "Please describe what you want to grow." }, 400);
    }
    if (prompt.length > 2000) {
      return json({ error: "Prompt too long (max 2000 chars)." }, 400);
    }

    const system = [
      "You parse an SMM (social media marketing) growth request into structured JSON.",
      "Return ONLY a JSON object matching this shape:",
      `{ "platform": string, "link": string|null, "base_quantity": integer, "is_organic_mode": boolean, "quantities": { [engagement_type: string]: integer } }`,
      "",
      `Allowed platforms: ${availablePlatforms.join(", ")}. Pick the best fit; if unclear, use "${selectedPlatform}".`,
      `Allowed engagement_type keys: ${KNOWN_TYPES.join(", ")}. Omit keys not requested.`,
      "Parse shorthand: '10k' = 10000, '1.5k' = 1500, '2m' = 2000000, '500' = 500.",
      "'base_quantity' should be the primary/largest quantity mentioned (usually views, or followers if that's the goal).",
      "'is_organic_mode' = true when user says: natural, organic, slow, drip, human, real, gradual, over X days/hours. false when: instant, fast, quick, now, immediately.",
      "'link' = a URL from the prompt if present (must start with http/https), else null.",
      "Do not invent quantities the user didn't ask for.",
      "Respond with the JSON object only — no code fences, no explanation.",
    ].join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "custom-fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limit hit. Try again in a moment." }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted. Contact admin." }, 402);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("ai-growth-parse upstream", aiRes.status, t);
      return json({ error: "AI request failed" }, 500);
    }

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON if model wrapped it
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    // Normalize + sanitize
    const platform = availablePlatforms.includes(parsed.platform)
      ? parsed.platform
      : selectedPlatform;

    const quantitiesRaw = parsed?.quantities && typeof parsed.quantities === "object"
      ? parsed.quantities
      : {};
    const quantities: Record<string, number> = {};
    for (const k of KNOWN_TYPES) {
      const v = Number(quantitiesRaw[k]);
      if (Number.isFinite(v) && v > 0) {
        quantities[k] = Math.max(1, Math.min(10_000_000, Math.round(v)));
      }
    }

    const largest = Math.max(0, ...Object.values(quantities));
    let base_quantity = Number(parsed.base_quantity);
    if (!Number.isFinite(base_quantity) || base_quantity <= 0) base_quantity = largest || 10000;
    base_quantity = Math.max(100, Math.min(10_000_000, Math.round(base_quantity)));

    const link = typeof parsed.link === "string" && /^https?:\/\//i.test(parsed.link)
      ? parsed.link.trim()
      : null;

    const is_organic_mode = parsed.is_organic_mode !== false; // default true

    return json({
      platform,
      link,
      base_quantity,
      is_organic_mode,
      quantities,
    });
  } catch (e: any) {
    console.error("ai-growth-parse error", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }

  function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
