import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Send, Loader2, Zap, TrendingUp, Users, MessageCircle, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const GRADIENT = "linear-gradient(135deg, #2563EB 0%, #D946EF 55%, #D946EF 100%)";

const STORAGE_KEY = "ai-assistant-chat-v1";

const SUGGESTIONS = [
  { icon: TrendingUp, text: "Instagram reel pe 1k views ke liye kitna engagement chahiye?" },
  { icon: Users, text: "Suggest a safe organic package for 10k TikTok views" },
  { icon: MessageCircle, text: "YouTube video ke liye 5000 views ka natural plan?" },
  { icon: Zap, text: "Instagram par grow karne ke top tips" },
];

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi! I'm your **MultySMM AI Growth Assistant** ✨\n\nAsk me anything about growing your social media — engagement ratios, safe organic pacing, best plans for a target view count, or platform tips.\n\nTry: *\"1000 views par Instagram reel me kitne likes aur comments hone chahiye?\"*",
};

export default function AiAssistant() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [WELCOME];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const historyForModel = next.filter((m) => m !== WELCOME);
      const { data, error } = await supabase.functions.invoke("ai-assistant-chat", {
        body: { messages: historyForModel },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const content = (data as any)?.content ?? "Sorry, I couldn't generate a response.";
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (e: any) {
      toast({ title: "AI failed", description: e?.message ?? "Try again", variant: "destructive" });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const reset = () => {
    setMessages([WELCOME]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const showSuggestions = messages.length <= 1;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-2 sm:px-4 py-4 flex flex-col" style={{ height: "calc(100vh - 100px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0"
              style={{ background: GRADIENT, boxShadow: "0 8px 20px -8px rgba(236,72,153,.4)" }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "#0F172A" }}>
                AI Growth Assistant
              </h1>
              <p className="text-xs" style={{ color: "#94A3B8" }}>
                Powered by MultySMM • Ask anything about social growth
              </p>
            </div>
          </div>
          {messages.length > 1 && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          )}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 space-y-4 scrollbar-thin"
        >
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && (
            <div className="flex items-start gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: GRADIENT }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s.text)}
                disabled={loading}
                className="text-left flex items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-fuchsia-300 hover:bg-fuchsia-50/40 transition-all disabled:opacity-50"
              >
                <s.icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#D946EF" }} />
                <span className="text-xs text-slate-700 line-clamp-2">{s.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <div className="mt-3 shrink-0">
          <div className="relative rounded-2xl border border-slate-200 bg-white focus-within:border-fuchsia-300 focus-within:ring-4 focus-within:ring-fuchsia-100 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about engagement ratios, growth plans, or platform tips…"
              rows={2}
              maxLength={2000}
              disabled={loading}
              className="w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none rounded-2xl"
            />
            <button
              onClick={() => send()}
              disabled={loading || input.trim().length < 2}
              className={cn(
                "absolute right-2 bottom-2 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all",
                "disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              )}
              style={{ background: GRADIENT }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1.5 text-[10.5px] text-center" style={{ color: "#94A3B8" }}>
            Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MessageBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex items-start gap-2.5", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold"
        )}
        style={{ background: isUser ? "#0F172A" : GRADIENT }}
      >
        {isUser ? "U" : <Sparkles className="w-4 h-4" />}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser ? "text-white" : "bg-slate-50 text-slate-800 border border-slate-100"
        )}
        style={isUser ? { background: "#0F172A" } : undefined}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-slate-900">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
