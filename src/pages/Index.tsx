import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Brain, Zap, Wand2, Layers, Shield, Shuffle,
  CheckCircle2, X, Instagram, Youtube, Music2, Twitter, Plus, Users,
  Package, Target, Activity,
} from 'lucide-react';
import { PageMeta } from '@/components/seo/PageMeta';

// MultySMM Noir Edition — Obsidian + Gold + Parchment
const C = {
  bg: '#0a0a0a',
  bgSoft: '#111111',
  panel: '#161616',
  panelSoft: '#1c1c1c',
  ink: '#efe7d4',         // parchment
  ink2: '#a8a094',
  muted: '#6b6357',
  line: 'rgba(201,168,76,.14)',
  lineSoft: 'rgba(239,231,212,.08)',
  gold: '#c9a84c',
  goldSoft: '#f0d78c',
  goldDeep: '#8a6f2a',
  serif: "'Instrument Serif', 'Times New Roman', serif",
  sans: "'Work Sans', system-ui, sans-serif",
};

const GOLD_GRAD = `linear-gradient(135deg, ${C.goldDeep} 0%, ${C.gold} 50%, ${C.goldSoft} 100%)`;
const GOLD_TEXT = `linear-gradient(135deg, ${C.goldSoft} 0%, ${C.gold} 45%, ${C.goldDeep} 100%)`;

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="inline-flex items-center gap-2 text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.32em]"
    style={{ color: C.gold }}>
    <span className="w-6 h-px" style={{ background: C.gold }} />
    {children}
    <span className="w-6 h-px" style={{ background: C.gold }} />
  </div>
);

const Index = () => {
  const [prompt, setPrompt] = useState('');

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: C.bg, color: C.ink, fontFamily: C.sans }}>
      <PageMeta
        title="MultySMM — Noir Edition · AI-Powered Growth Atelier"
        description="A noir, AI-paced growth atelier for creators. Paste a link, choose your ascent, watch MultySMM deliver editorial-grade engagement."
        canonicalPath="/"
        breadcrumbs={[{ name: 'Home', path: '/' }]}
      />

      {/* ambient gold orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(201,168,76,.15), transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute top-[55%] -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(240,215,140,.10), transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute bottom-0 -left-40 w-[600px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(138,111,42,.12), transparent 70%)', filter: 'blur(60px)' }} />
        {/* subtle grain */}
        <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }} />
      </div>

      {/* ═══ NAV ═══ */}
      <nav className="sticky top-4 z-50 w-full px-3 sm:px-4">
        <div className="max-w-6xl mx-auto rounded-full flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6"
          style={{ background: 'rgba(15,15,15,.75)', backdropFilter: 'blur(24px) saturate(140%)', border: `1px solid ${C.line}`, boxShadow: '0 12px 40px rgba(0,0,0,.55), inset 0 1px 0 rgba(240,215,140,.08)' }}>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center font-black text-[15px]"
              style={{ background: GOLD_GRAD, color: '#0a0a0a', boxShadow: '0 6px 20px rgba(201,168,76,.35), inset 0 1px 0 rgba(255,255,255,.4)' }}>
              M
            </div>
            <div className="leading-tight">
              <div className="text-[15.5px] font-bold tracking-tight" style={{ color: C.ink }}>MultySMM</div>
              <div className="text-[8.5px] uppercase tracking-[0.32em]" style={{ color: C.gold }}>✦ Noir Edition</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[['Atelier','#how'],['Craft','#features'],['Manifesto','#why'],['FAQ','#faq']].map(([t,h]) => (
              <a key={t} href={h} className="text-[12.5px] font-medium uppercase tracking-[0.18em] transition-colors"
                style={{ color: C.ink2 }}
                onMouseEnter={(e)=>(e.currentTarget.style.color=C.gold)}
                onMouseLeave={(e)=>(e.currentTarget.style.color=C.ink2)}>{t}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:inline-flex h-9 px-3 items-center text-[12.5px] font-medium uppercase tracking-[0.18em]" style={{ color: C.ink }}>
              Sign In
            </Link>
            <Link to="/auth" className="h-10 px-5 rounded-full text-[12px] font-bold uppercase tracking-[0.18em] inline-flex items-center gap-1.5"
              style={{ background: GOLD_GRAD, color: '#0a0a0a', boxShadow: '0 10px 28px rgba(201,168,76,.30), inset 0 1px 0 rgba(255,255,255,.35)' }}>
              Enter <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-20 sm:pt-28 lg:pt-32 pb-16 sm:pb-24 text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10"><Eyebrow>An AI Growth Atelier · Est. 2026</Eyebrow></div>

          <h1 className="text-[2.8rem] sm:text-[4.6rem] lg:text-[6.2rem] leading-[0.95] tracking-[-0.025em] mb-8"
            style={{ fontFamily: C.serif, fontWeight: 400 }}>
            <span style={{ color: C.ink }}>Grow </span>
            <em style={{ background: GOLD_TEXT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              smarter accounts
            </em>
            <br />
            <span style={{ color: C.ink2 }}>instantly with </span>
            <em style={{ background: GOLD_TEXT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AI</em>
            <span style={{ color: C.gold }}>.</span>
          </h1>

          <p className="text-[15px] sm:text-[17.5px] leading-[1.7] mb-12 max-w-2xl mx-auto" style={{ color: C.ink2 }}>
            Paste your link. Compose your ascent. MultySMM's noir engine delivers
            real, human-paced engagement — orchestrated like a private commission.
          </p>

          {/* ═══ AI GROWTH ENGINE — noir console ═══ */}
          <div className="max-w-3xl mx-auto rounded-[28px] p-1 text-left relative"
            style={{ background: `linear-gradient(135deg, ${C.goldDeep}, ${C.gold}, ${C.goldSoft}, ${C.goldDeep})`, boxShadow: '0 40px 100px -30px rgba(201,168,76,.35), 0 0 0 1px rgba(201,168,76,.10)' }}>
            <div className="rounded-[24px] p-5 sm:p-7 relative overflow-hidden"
              style={{ background: 'radial-gradient(120% 100% at 0% 0%, #1a1a1a 0%, #0d0d0d 60%)' }}>
              {/* corner filigree */}
              <div aria-hidden className="absolute top-3 right-3 w-12 h-12 opacity-40">
                <svg viewBox="0 0 48 48" fill="none"><path d="M2 2h14M2 2v14M46 46h-14M46 46v-14" stroke={C.gold} strokeWidth="0.8" /></svg>
              </div>

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.32em]" style={{ color: C.gold }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.gold, boxShadow: `0 0 12px ${C.gold}` }} /> AI Growth Console
                </div>
                <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.22em]" style={{ color: C.muted }}>
                  <Sparkles className="w-3 h-3" style={{ color: C.goldSoft }} /> Noir Engine v3
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Compose your ascent — e.g. 10k organic views, 800 likes & 50 comments on my Reel, paced over 18 hours."
                className="w-full h-28 sm:h-32 resize-none rounded-2xl p-4 text-[14.5px] outline-none transition-all"
                style={{ background: '#0a0a0a', color: C.ink, border: `1px solid ${C.line}`, fontFamily: C.sans }}
              />

              <div className="flex items-center justify-between gap-3 mt-5 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <button className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                    style={{ border: `1px solid ${C.line}`, color: C.ink2 }}>
                    <Plus className="w-4 h-4" />
                  </button>
                  {[
                    { icon: Instagram, label: 'Instagram' },
                    { icon: Youtube, label: 'YouTube' },
                    { icon: Music2, label: 'TikTok' },
                    { icon: Twitter, label: 'X' },
                  ].map((p) => (
                    <button key={p.label} className="h-9 px-3.5 rounded-full flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] transition-all"
                      style={{ border: `1px solid ${C.line}`, color: C.ink, background: 'rgba(201,168,76,.04)' }}>
                      <p.icon className="w-3.5 h-3.5" style={{ color: C.gold }} /> {p.label}
                    </button>
                  ))}
                </div>
                <Link to="/auth" className="h-11 px-6 rounded-full text-[12px] font-bold uppercase tracking-[0.22em] inline-flex items-center gap-2"
                  style={{ background: GOLD_GRAD, color: '#0a0a0a', boxShadow: '0 14px 32px rgba(201,168,76,.35), inset 0 1px 0 rgba(255,255,255,.4)' }}>
                  Commission <Sparkles className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* prompt examples */}
          <div className="mt-7 flex flex-col items-center gap-2.5">
            {[
              'Grow my Instagram reel — 10k views · 800 likes · 50 comments',
              'YouTube video — 5k views · 300 likes · 100 subscribers',
              'TikTok — 20k views · 1.5k likes · 200 followers',
            ].map((t) => (
              <button key={t} className="text-[12px] sm:text-[12.5px] px-5 py-2.5 rounded-full transition-all uppercase tracking-[0.14em] font-medium"
                style={{ border: `1px solid ${C.lineSoft}`, color: C.ink2, background: 'rgba(22,22,22,.6)', backdropFilter: 'blur(8px)' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <Eyebrow>The Atelier · Three Movements</Eyebrow>
            <h2 className="mt-6 text-[2.2rem] sm:text-[3.2rem] lg:text-[3.8rem] leading-[1.02] tracking-[-0.02em]"
              style={{ fontFamily: C.serif, fontWeight: 400 }}>
              From a single link<br /> to <em style={{ background: GOLD_TEXT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>measured ascent</em>.
            </h2>

            <div className="mt-10 space-y-3">
              {[
                { n: 'I', t: 'Present the link', d: 'Drop any Instagram, YouTube or TikTok URL — the atelier needs nothing more.' },
                { n: 'II', t: 'Compose the brief', d: 'Choose views, likes, comments, saves and shares. Set quantity for each movement.' },
                { n: 'III', t: 'Witness the delivery', d: 'AI plans the curve, jitters timing, and unfurls naturally over the chosen hours.' },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl p-6 transition-all hover:-translate-y-0.5 group"
                  style={{ background: 'linear-gradient(180deg, #161616 0%, #111111 100%)', border: `1px solid ${C.line}`, boxShadow: 'inset 0 1px 0 rgba(240,215,140,.05)' }}>
                  <div className="flex items-baseline gap-5">
                    <span className="text-[20px] font-normal" style={{ fontFamily: C.serif, color: C.gold, fontStyle: 'italic' }}>{s.n}.</span>
                    <div className="flex-1">
                      <h3 className="text-[16px] font-semibold mb-1.5" style={{ color: C.ink }}>{s.t}</h3>
                      <p className="text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>{s.d}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/auth" className="mt-10 inline-flex h-12 px-7 rounded-full text-[12px] font-bold uppercase tracking-[0.22em] items-center gap-2"
              style={{ background: GOLD_GRAD, color: '#0a0a0a', boxShadow: '0 16px 36px rgba(201,168,76,.30), inset 0 1px 0 rgba(255,255,255,.4)' }}>
              Begin a commission <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* preview card */}
          <div className="relative">
            <div aria-hidden className="absolute -inset-10 rounded-[40px] -z-10"
              style={{ background: 'radial-gradient(closest-side, rgba(201,168,76,.20), rgba(138,111,42,.08) 60%, transparent 80%)', filter: 'blur(40px)' }} />
            <div className="rounded-3xl p-7 relative"
              style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)', border: `1px solid ${C.line}`, boxShadow: '0 40px 100px -30px rgba(201,168,76,.25), inset 0 1px 0 rgba(240,215,140,.06)' }}>
              {/* floating chip top-left */}
              <div className="absolute -top-4 -left-4 rounded-2xl px-3 py-2 flex items-center gap-2"
                style={{ background: '#0d0d0d', border: `1px solid ${C.line}`, boxShadow: '0 12px 32px rgba(0,0,0,.6)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,168,76,.15)', border: `1px solid ${C.line}` }}>
                  <CheckCircle2 className="w-4 h-4" style={{ color: C.gold }} />
                </div>
                <div className="leading-tight">
                  <div className="text-[12px] font-bold" style={{ color: C.ink }}>+1,250 views</div>
                  <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>2 min ago</div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.32em]" style={{ color: C.muted }}>multysmm.atelier/commission</div>
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: C.line }} />)}
                </div>
              </div>

              <div className="rounded-xl px-3 py-2.5 mb-5 text-[11.5px] font-mono truncate"
                style={{ background: '#0a0a0a', border: `1px solid ${C.line}`, color: C.ink2 }}>
                https://instagram.com/p/Cx9...
              </div>

              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {[
                  { l: 'Views', v: '10K' },
                  { l: 'Likes', v: '800' },
                  { l: 'Comments', v: '50' },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl p-3 text-center" style={{ background: '#0a0a0a', border: `1px solid ${C.line}` }}>
                    <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: C.muted }}>{s.l}</div>
                    <div className="text-[22px] font-bold mt-1" style={{ fontFamily: C.serif, background: GOLD_TEXT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.v}</div>
                  </div>
                ))}
              </div>

              <svg viewBox="0 0 320 100" className="w-full h-24">
                <defs>
                  <linearGradient id="curve" x1="0" x2="1">
                    <stop offset="0%" stopColor={C.goldDeep} />
                    <stop offset="50%" stopColor={C.gold} />
                    <stop offset="100%" stopColor={C.goldSoft} />
                  </linearGradient>
                  <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={C.gold} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 80 C 60 78, 100 60, 160 35 S 260 20, 320 28 L 320 100 L 0 100 Z" fill="url(#fill)" />
                <path d="M0 80 C 60 78, 100 60, 160 35 S 260 20, 320 28" stroke="url(#curve)" strokeWidth="2.5" fill="none" />
              </svg>

              <div className="flex items-center justify-between mt-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: C.muted }}>
                <span>Now</span><span>+6h</span><span>+12h</span><span>+24h</span>
              </div>

              <div className="absolute -bottom-4 -right-4 rounded-2xl px-3 py-2 flex items-center gap-2"
                style={{ background: '#0d0d0d', border: `1px solid ${C.line}`, boxShadow: '0 12px 32px rgba(0,0,0,.6)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,168,76,.15)', border: `1px solid ${C.line}` }}>
                  <Brain className="w-4 h-4" style={{ color: C.gold }} />
                </div>
                <div className="leading-tight">
                  <div className="text-[12px] font-bold" style={{ color: C.ink }}>AI scheduling</div>
                  <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>Optimized curve</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative" style={{ background: 'linear-gradient(180deg, transparent 0%, #0d0d0d 50%, transparent 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Eyebrow>The Craft · Six Disciplines</Eyebrow>
            <h2 className="mt-6 text-[2.2rem] sm:text-[3.2rem] lg:text-[3.8rem] leading-[1.02] tracking-[-0.02em]"
              style={{ fontFamily: C.serif, fontWeight: 400 }}>
              Built for speed,<br />
              tailored by <em style={{ background: GOLD_TEXT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>intelligence</em>.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-[28px] overflow-hidden"
            style={{ background: C.line, border: `1px solid ${C.line}` }}>
            {[
              { icon: Brain, t: 'AI Delivery Assist', d: 'Every commission is paced by AI — analyzing peak hours, jitter and audience timezone for natural growth.' },
              { icon: Zap, t: 'Instant Inception', d: 'Orders begin within 60 seconds. No waiting, no queues — straight into delivery.' },
              { icon: Wand2, t: 'Visual Customizer', d: 'Tune quantity, speed, and spread with a live curve preview before the brief is signed.' },
              { icon: Shuffle, t: 'Multi-Provider Routing', d: 'We rotate across top-tier providers so you always receive the fastest, safest source.' },
              { icon: Layers, t: 'Engagement Bundles', d: 'Pre-composed packs for Reels, Shorts, Stories and viral campaigns — one click, done.' },
              { icon: Shield, t: 'Account Safety First', d: 'Human-pace patterns, ±50% variance and night slowdown — zero account bans on record.' },
            ].map((f, i) => (
              <div key={f.t} className="p-7 sm:p-8 transition-all group relative"
                style={{ background: C.bg }}>
                <div className="absolute top-5 right-6 text-[9.5px] font-medium uppercase tracking-[0.32em]" style={{ color: C.muted, fontFamily: C.serif, fontStyle: 'italic' }}>
                  №{String(i+1).padStart(2,'0')}
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'radial-gradient(closest-side, rgba(201,168,76,.18), rgba(201,168,76,.04))', border: `1px solid ${C.line}` }}>
                  <f.icon className="w-5 h-5" style={{ color: C.gold }} />
                </div>
                <h3 className="text-[18px] mb-2.5" style={{ fontFamily: C.serif, color: C.ink }}>{f.t}</h3>
                <p className="text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MANIFESTO / COMPARISON ═══ */}
      <section id="why" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Eyebrow>The Manifesto</Eyebrow>
            <h2 className="mt-6 text-[2.2rem] sm:text-[3.2rem] lg:text-[3.8rem] leading-[1.02] tracking-[-0.02em]"
              style={{ fontFamily: C.serif, fontWeight: 400 }}>
              The old panels deliver volume.<br />
              <em style={{ background: GOLD_TEXT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>We deliver craft.</em>
            </h2>
          </div>

          <div className="relative grid md:grid-cols-2 gap-5">
            {/* OLD */}
            <div className="rounded-3xl p-8 relative"
              style={{ background: '#111111', border: `1px dashed ${C.lineSoft}` }}>
              <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-[0.22em]"
                style={{ background: 'rgba(239,68,68,.08)', color: '#a85858', border: '1px solid rgba(239,68,68,.18)' }}>
                <X className="w-3 h-3" /> Old Way
              </span>
              <div className="text-[10px] font-medium uppercase tracking-[0.32em] mb-3" style={{ color: C.muted }}>Regular Panels</div>
              <h3 className="text-[26px] mb-6" style={{ fontFamily: C.serif, color: C.ink2, fontStyle: 'italic' }}>Bot-pattern delivery</h3>
              <div className="space-y-3.5">
                {[
                  'Same quantity each batch — pattern visible',
                  'Fixed intervals, zero variance',
                  '24/7 dumping looks unnatural',
                  'Account flags & bans common',
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)' }}>
                      <X className="w-3 h-3" style={{ color: '#a85858' }} />
                    </div>
                    <span className="text-[13.5px]" style={{ color: C.ink2 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* VS badge */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full items-center justify-center z-10 font-black text-[13px] uppercase tracking-widest"
              style={{ background: GOLD_GRAD, color: '#0a0a0a', boxShadow: '0 14px 40px rgba(201,168,76,.40), inset 0 1px 0 rgba(255,255,255,.4)' }}>VS</div>

            {/* NEW */}
            <div className="rounded-3xl p-8 relative overflow-hidden"
              style={{ background: 'radial-gradient(120% 100% at 100% 0%, #1f1a0d 0%, #0d0d0d 60%)', border: `1px solid ${C.gold}`, boxShadow: '0 40px 100px -30px rgba(201,168,76,.40), inset 0 1px 0 rgba(240,215,140,.15)' }}>
              <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-[0.22em]"
                style={{ background: 'rgba(201,168,76,.15)', color: C.goldSoft, border: `1px solid ${C.line}` }}>
                <Sparkles className="w-3 h-3" /> Noir Way
              </span>
              <div className="text-[10px] font-medium uppercase tracking-[0.32em] mb-3" style={{ color: C.gold }}>MultySMM Atelier</div>
              <h3 className="text-[26px] mb-6" style={{ fontFamily: C.serif, color: C.ink }}>
                <em style={{ background: GOLD_TEXT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI-organic</em> delivery
              </h3>
              <div className="space-y-3.5">
                {[
                  'Random variance — indistinguishable from humans',
                  'AI-jittered timing — undetectable',
                  'Peak hours + night slowdown built-in',
                  '100% safe — zero account bans on record',
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'rgba(201,168,76,.18)', border: `1px solid ${C.line}` }}>
                      <CheckCircle2 className="w-3 h-3" style={{ color: C.gold }} />
                    </div>
                    <span className="text-[13.5px]" style={{ color: C.ink }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-14 rounded-[28px] p-px relative overflow-hidden"
            style={{ background: GOLD_GRAD }}>
            <div className="rounded-[27px] grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: C.line }}>
              {[
                { n: 'I',   icon: Users,   v: '2,400+', l: 'Active Creators' },
                { n: 'II',  icon: Package, v: '50K+',   l: 'Commissions Delivered' },
                { n: 'III', icon: Target,  v: '99.9%',  l: 'Success Rate' },
                { n: 'IV',  icon: Zap,     v: '24 / 7', l: 'Concierge' },
              ].map((s) => (
                <div key={s.l} className="p-8 text-center relative" style={{ background: '#0d0d0d' }}>
                  <div className="text-[11px] uppercase tracking-[0.32em] mb-4" style={{ color: C.gold, fontFamily: C.serif, fontStyle: 'italic' }}>{s.n}</div>
                  <s.icon className="w-6 h-6 mx-auto mb-3" style={{ color: C.ink2 }} />
                  <div className="text-[34px] sm:text-[42px] leading-none"
                    style={{ fontFamily: C.serif, background: GOLD_TEXT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {s.v}
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.32em] mt-3" style={{ color: C.muted }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-[36px] text-center py-20 px-6 sm:px-12 relative overflow-hidden"
          style={{ background: 'radial-gradient(120% 100% at 50% 0%, #1f1a0d 0%, #0a0a0a 60%)', border: `1px solid ${C.gold}`, boxShadow: '0 40px 120px -30px rgba(201,168,76,.45), inset 0 1px 0 rgba(240,215,140,.12)' }}>
          {/* gold filigree corners */}
          {[
            'top-5 left-5 rotate-0', 'top-5 right-5 rotate-90',
            'bottom-5 left-5 -rotate-90', 'bottom-5 right-5 rotate-180',
          ].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-10 h-10 opacity-50`}>
              <svg viewBox="0 0 40 40" fill="none"><path d="M2 2h14M2 2v14" stroke={C.gold} strokeWidth="0.8" /></svg>
            </div>
          ))}
          <div aria-hidden className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(201,168,76,.30), transparent 70%)', filter: 'blur(50px)' }} />
          <div className="relative">
            <Eyebrow>By Appointment</Eyebrow>
            <h2 className="mt-6 text-[2.4rem] sm:text-[3.6rem] leading-[1.02] tracking-[-0.02em] mb-6"
              style={{ fontFamily: C.serif, fontWeight: 400, color: C.ink }}>
              Ready to grow <em style={{ background: GOLD_TEXT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>smarter</em>?
            </h2>
            <p className="text-[15px] sm:text-[16.5px] mb-10 max-w-md mx-auto" style={{ color: C.ink2 }}>
              Join 2,400+ creators commissioning growth through the MultySMM atelier.
              No card required.
            </p>
            <Link to="/auth" className="inline-flex h-13 px-9 py-4 rounded-full text-[12px] font-bold uppercase tracking-[0.28em] items-center gap-2.5"
              style={{ background: GOLD_GRAD, color: '#0a0a0a', boxShadow: '0 18px 44px rgba(201,168,76,.40), inset 0 1px 0 rgba(255,255,255,.45)' }}>
              Open an account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-14 px-4 sm:px-6 lg:px-8" style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black"
                  style={{ background: GOLD_GRAD, color: '#0a0a0a', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4)' }}>M</div>
                <div className="leading-tight">
                  <div className="text-[16px] font-bold" style={{ color: C.ink }}>MultySMM</div>
                  <div className="text-[8.5px] uppercase tracking-[0.32em]" style={{ color: C.gold }}>✦ Noir Edition</div>
                </div>
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: C.ink2 }}>
                The AI-powered growth atelier for creators who treat their accounts as craft.
              </p>
            </div>
            {[
              { h: 'Atelier',  links: [['Features','#features'],['API','/api-access']] },
              { h: 'House',    links: [['About','/about'],['Contact','/contact'],['Support','/support']] },
              { h: 'Legal',    links: [['Terms','/terms'],['Privacy','/privacy'],['Refunds','/refund'],['Cookies','/cookies']] },
            ].map((col) => (
              <div key={col.h}>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.32em] mb-5" style={{ color: C.gold }}>{col.h}</h4>
                <div className="space-y-3">
                  {col.links.map(([t,h]) => (
                    h.startsWith('#')
                      ? <a key={t} href={h} className="block text-[13px]" style={{ color: C.ink2 }}>{t}</a>
                      : <Link key={t} to={h} className="block text-[13px]" style={{ color: C.ink2 }}>{t}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-7" style={{ borderTop: `1px solid ${C.line}` }}>
            <p className="text-[11.5px] uppercase tracking-[0.22em]" style={{ color: C.muted }}>© {new Date().getFullYear()} MultySMM — All rights reserved.</p>
            <div className="flex items-center gap-6 text-[11.5px] font-medium uppercase tracking-[0.22em]" style={{ color: C.muted }}>
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" style={{ color: C.gold }} /> SSL Secured</span>
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" style={{ color: C.gold }} /> 99.9% Uptime</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
