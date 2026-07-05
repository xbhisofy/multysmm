import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Zap, Instagram, Youtube, Twitter, Music2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AiGrowthResult {
  platform: string;
  link: string | null;
  base_quantity: number;
  is_organic_mode: boolean;
  quantities: Record<string, number>;
}

interface Props {
  availablePlatforms: string[];
  selectedPlatform: string;
  onPlatformChange: (p: string) => void;
  onApply: (result: AiGrowthResult) => void;
}

const PLATFORM_META: Record<string, { label: string; Icon: any }> = {
  instagram: { label: "Instagram", Icon: Instagram },
  youtube: { label: "YouTube", Icon: Youtube },
  tiktok: { label: "TikTok", Icon: Music2 },
  twitter: { label: "Twitter", Icon: Twitter },
};

const SAMPLE_PROMPTS = [
  "Grow my Instagram reel with 10k views, 800 likes, 50 comments — natural pace",
  "Boost my YouTube video to 5000 views and 200 likes over 3 days",
  "TikTok: 20k views + 1500 likes + 100 shares, organic",
];

export function AiGrowthEngine({ availablePlatforms, selectedPlatform, onPlatformChange, onApply }: Props) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const platformsToShow = availablePlatforms.length > 0
    ? availablePlatforms.filter((p) => PLATFORM_META[p])
    : Object.keys(PLATFORM_META);

  const handleGenerate = async () => {
    const clean = prompt.trim();
    if (clean.length < 3) {
      toast({ title: "Type something", description: "Describe what you want to grow.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-growth-parse", {
        body: { prompt: clean, availablePlatforms, selectedPlatform },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const result = data as AiGrowthResult;
      onApply(result);
      const summary = Object.entries(result.quantities || {})
        .map(([k, v]) => `${(v as number).toLocaleString()} ${k}`)
        .join(" • ");
      toast({
        title: "✨ AI plan ready",
        description: `${result.platform.toUpperCase()} — ${summary || `base ${result.base_quantity.toLocaleString()}`}`,
      });
    } catch (e: any) {
      toast({ title: "AI failed", description: e?.message ?? "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mb-6">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-orange-200/40 via-fuchsia-200/30 to-indigo-200/40 blur-2xl" />

      <div className="rounded-3xl border border-slate-200/70 bg-white/90 backdrop-blur-xl p-4 sm:p-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-orange-100">
              <Zap className="w-4.5 h-4.5 text-orange-500 fill-orange-500" strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-bold tracking-[0.14em] text-slate-900">
              AI GROWTH ENGINE
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold text-indigo-600">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by MultySMM
          </div>
        </div>

        {/* Prompt area */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 focus-within:border-orange-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100 transition-all">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleGenerate();
            }}
            placeholder="Grow my Instagram reel with 10k views, 800 likes, 50 comments — natural pace"
            rows={3}
            maxLength={2000}
            className="w-full resize-none bg-transparent px-4 py-3.5 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Sample chips (only when empty) */}
        {!prompt && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {SAMPLE_PROMPTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPrompt(s)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-700 transition-colors"
              >
                {s.length > 45 ? s.slice(0, 45) + "…" : s}
              </button>
            ))}
          </div>
        )}

        {/* Bottom row: platform pills + generate */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            title="More platforms below"
          >
            <Plus className="w-4 h-4" />
          </button>

          {platformsToShow.map((p) => {
            const { label, Icon } = PLATFORM_META[p];
            const active = p === selectedPlatform;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPlatformChange(p)}
                className={cn(
                  "flex items-center gap-1.5 h-9 px-3 rounded-full border text-[13px] font-semibold transition-all",
                  active
                    ? "border-orange-400 bg-orange-50 text-orange-600 shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}

          <div className="flex-1" />

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || prompt.trim().length < 3}
            className={cn(
              "relative group flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-white text-[14px]",
              "bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-500",
              "shadow-[0_8px_25px_-8px_rgba(244,63,94,0.6)]",
              "hover:shadow-[0_10px_30px_-8px_rgba(244,63,94,0.75)]",
              "hover:scale-[1.02] active:scale-[0.98] transition-all",
              "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking…
              </>
            ) : (
              <>
                Generate
                <Zap className="w-4 h-4 fill-white" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>

        <div className="mt-2 text-[11px] text-slate-400 text-right">
          Tip: press ⌘/Ctrl + Enter to generate
        </div>
      </div>
    </div>
  );
}
