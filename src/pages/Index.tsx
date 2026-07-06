import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Brain, Zap, Wand2, Layers, Shield, Shuffle,
  CheckCircle2, X, Instagram, Youtube, Music2, Twitter, Plus, Users,
  Package, Target, Activity, Link2,
} from 'lucide-react';
import { PageMeta } from '@/components/seo/PageMeta';

// MultySMM brand palette — 3 logo colors (orange → magenta → purple)
const C = {
  bg: '#FFFFFF',
  bgSoft: '#FBF8FE',
  ink: '#0F1A2B',
  ink2: '#4A4A5E',
  muted: '#8A8A9E',
  line: 'rgba(15,26,43,.08)',
  card: '#FFFFFF',
  orange: '#F26522',
  magenta: '#D63384',
  purple: '#7B2CBF',
  purpleDeep: '#5A189A',
  pink: '#D63384',
  lilac: '#F3E8FF',
  orangeSoft: '#FFEDE3',
  magentaSoft: '#FCE7F1',
  serif: "'Instrument Serif', 'Times New Roman', serif",
  sans: "'Inter', system-ui, sans-serif",
};

const GRADIENT = `linear-gradient(135deg, #F26522 0%, #D63384 50%, #7B2CBF 100%)`;
const TRI = ['#F26522', '#D63384', '#7B2CBF'];
const TRI_SOFT = ['#FFEDE3', '#FCE7F1', '#F3E8FF'];


const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="inline-flex items-center gap-2 text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.18em]"
    style={{ color: C.purple }}>
    <Sparkles className="w-3.5 h-3.5" /> {children}
  </div>
);

const Index = () => {
  const [prompt, setPrompt] = useState('');

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: C.bg, color: C.ink, fontFamily: C.sans }}>
      <PageMeta
        title="MultySMM — AI-Powered Social Media Growth Panel"
        description="Paste your post link, pick what to grow, and let MultySMM deliver real, human-paced engagement — AI-scheduled and 100% safe."
        canonicalPath="/"
        breadcrumbs={[{ name: 'Home', path: '/' }]}
      />

      {/* soft purple glow background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(124,58,237,.18), transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-[60%] -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(236,72,153,.18), transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* ═══ NAV ═══ */}
      <nav className="sticky top-4 z-50 w-full px-3 sm:px-4">
        <div className="max-w-6xl mx-auto rounded-full flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6"
          style={{ background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(20px) saturate(180%)', border: `1px solid ${C.line}`, boxShadow: '0 8px 32px rgba(11,11,22,.06)' }}>
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="MultySMM" className="h-12 sm:h-14 w-auto object-contain" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[['Features','#features'],['How it works','#how'],['Why us','#why'],['FAQ','#faq']].map(([t,h]) => (
              <a key={t} href={h} className="text-[13.5px] font-medium transition-opacity hover:opacity-70" style={{ color: C.ink2 }}>{t}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:inline-flex h-9 px-3 items-center text-[13.5px] font-semibold" style={{ color: C.ink }}>
              Log in
            </Link>
            <Link to="/auth" className="h-10 px-5 rounded-full text-[13px] font-bold text-white inline-flex items-center gap-1.5"
              style={{ background: GRADIENT, boxShadow: '0 10px 24px rgba(168,85,247,.35)' }}>
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </nav>

      <main>
      {/* ═══ HERO ═══ */}
      <section className="pt-16 sm:pt-24 lg:pt-28 pb-16 sm:pb-24 text-center px-4 sm:px-6 lg:px-8 relative">
        {/* extra ambient glows behind hero */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
            style={{ background: 'rgba(124,58,237,.10)', filter: 'blur(120px)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
            style={{ background: 'rgba(236,72,153,.10)', filter: 'blur(100px)' }} />
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{ background: '#F5EFFF', border: '1px solid rgba(124,58,237,.18)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.purple }} />
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em] uppercase" style={{ color: C.purpleDeep }}>
              AI-Powered SMM Panel
            </span>
          </div>

          <h1 className="text-[2.8rem] sm:text-[4.6rem] lg:text-[6.2rem] font-black leading-[1.02] tracking-[-0.04em] mb-8" style={{ fontFamily: C.sans }}>
            Grow{' '}
            <span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Smarter Accounts
            </span>
            <br className="hidden sm:block" />
            Instantly With{' '}
            <span style={{ color: '#CBD5E1' }}>AI</span>
          </h1>

          <p className="text-[15px] sm:text-[18px] leading-[1.65] mb-14 sm:mb-16 max-w-2xl mx-auto" style={{ color: C.ink2 }}>
            Paste your link, select growth parameters, and watch MultySMM deliver{' '}
            <span className="font-semibold italic" style={{ color: C.ink }}>human-paced engagement</span>{' '}
            designed for safety and speed.
          </p>

          {/* ═══ AI GROWTH ENGINE (Premium glass) ═══ */}
          <div className="max-w-3xl mx-auto relative">
            {/* outer glow */}
            <div aria-hidden className="absolute -inset-1 rounded-[42px] -z-10"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,.25), rgba(236,72,153,.25))', filter: 'blur(40px)' }} />
            {/* gradient frame */}
            <div className="p-[6px] rounded-[40px]"
              style={{ background: 'linear-gradient(180deg, rgba(203,189,232,.7) 0%, rgba(255,255,255,0) 100%)', boxShadow: '0 30px 80px -20px rgba(124,58,237,.30)' }}>
              <div className="rounded-[34px] p-5 sm:p-7 text-left"
                style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(20px)' }}>
                {/* Meta Header */}
                <div className="flex items-center justify-between mb-6 px-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg" style={{ background: '#F3E8FF' }}>
                      <Zap className="w-4 h-4" style={{ color: C.purple }} />
                    </div>
                    <span className="text-[11px] font-extrabold tracking-[0.18em] uppercase" style={{ color: C.ink }}>
                      AI Growth Engine
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold" style={{ color: C.muted }}>
                    <Sparkles className="w-3 h-3" style={{ color: C.pink }} /> Powered by MultySMM
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Grow my Instagram reel with 10k views, 800 likes, 50 comments — natural pace"
                  className="w-full min-h-[120px] sm:min-h-[140px] resize-none rounded-3xl p-6 sm:p-7 text-[15px] sm:text-[17px] leading-relaxed font-medium outline-none transition-all focus:bg-white focus:ring-4"
                  style={{ background: 'rgba(248,247,253,.6)', color: C.ink, border: '1px solid rgba(124,58,237,.10)' }}
                />

                {/* Control bar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mt-6">
                  <div className="flex flex-wrap items-center gap-2 flex-grow">
                    <button aria-label="Add attachment" className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors hover:bg-purple-50 shrink-0"
                      style={{ background: '#F4F4F8', color: C.muted }}>
                      <Plus className="w-4 h-4" />
                    </button>
                    {[
                      { icon: Instagram, label: 'Instagram', active: true },
                      { icon: Youtube, label: 'YouTube' },
                      { icon: Music2, label: 'TikTok' },
                      { icon: Twitter, label: 'Twitter' },
                    ].map((p) => (
                      <button key={p.label}
                        className="h-10 sm:h-11 px-3.5 sm:px-4 rounded-2xl flex items-center gap-2 text-[12px] font-bold transition-all"
                        style={p.active
                          ? { border: `2px solid ${C.purple}`, background: 'rgba(243,232,255,.5)', color: C.ink }
                          : { border: `1px solid ${C.line}`, background: '#fff', color: C.muted }}>
                        <p.icon className="w-3.5 h-3.5" /> {p.label}
                      </button>
                    ))}
                  </div>
                  <Link to="/auth"
                    className="group w-full lg:w-auto h-12 px-8 sm:px-10 rounded-2xl text-[14px] font-extrabold text-white inline-flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95"
                    style={{ background: GRADIENT, boxShadow: '0 14px 30px rgba(236,72,153,.40)' }}>
                    Generate
                    <Zap className="w-4 h-4 transition-transform group-hover:rotate-12" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* prompt examples */}
          <div className="mt-10 flex flex-col items-center gap-2.5">
            {[
              '🎬  Grow my Instagram reel — 10k views, 800 likes, 50 comments',
              '▶️  YouTube video: 5k views, 300 likes, 100 subscribers',
              '🎵  TikTok: 20k views, 1.5k likes, 200 followers',
            ].map((t) => (
              <button key={t} className="text-[12.5px] sm:text-[13px] px-4 py-2 rounded-full transition-colors hover:bg-purple-50"
                style={{ border: `1px solid ${C.line}`, color: C.ink2, background: C.card }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 text-[2rem] sm:text-[3rem] lg:text-[3.4rem] font-black leading-[1.02] tracking-[-0.035em]">
              From link to growth<br /> in <span style={{ fontFamily: C.serif, fontStyle: 'italic', fontWeight: 400, background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>3 simple steps</span>
            </h2>

            <div className="mt-8 space-y-3">
              {[
                { n: '01', t: 'Paste your post link', d: 'Drop any Instagram, YouTube or TikTok URL — that is all we need to begin.' },
                { n: '02', t: 'Pick what to grow', d: 'Choose views, likes, comments, saves and shares. Set quantity for each.' },
                { n: '03', t: 'Watch it deliver', d: 'AI plans the curve, jitters timing, and delivers naturally over hours.' },
              ].map((s, i) => (
                <div key={s.n} className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                  style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: '0 4px 20px rgba(11,11,22,.04)' }}>
                  <div className="flex items-baseline gap-4">
                    <span className="text-[14px] font-bold" style={{ color: TRI[i % 3] }}>{s.n}</span>
                    <div className="flex-1">
                      <h3 className="text-[16px] font-bold mb-1.5">{s.t}</h3>
                      <p className="text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>{s.d}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/auth" className="mt-8 inline-flex h-12 px-6 rounded-full text-[14px] font-bold text-white items-center gap-2"
              style={{ background: GRADIENT, boxShadow: '0 14px 30px rgba(124,58,237,.35)' }}>
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* preview card */}
          <div className="relative">
            <div aria-hidden className="absolute -inset-8 rounded-[40px] -z-10"
              style={{ background: 'radial-gradient(closest-side, rgba(236,72,153,.20), rgba(124,58,237,.10) 60%, transparent 80%)', filter: 'blur(30px)' }} />
            <div className="rounded-3xl p-6 sm:p-7 relative"
              style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 100%)', border: `1px solid ${C.line}`, boxShadow: '0 30px 80px -20px rgba(124,58,237,.25)' }}>
              {/* floating success chip */}
              <div className="absolute -top-4 -left-4 rounded-2xl px-3 py-2 flex items-center gap-2"
                style={{ background: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 10px 30px rgba(11,11,22,.10)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#D1FAE5' }}>
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#059669' }} />
                </div>
                <div className="leading-tight">
                  <div className="text-[12px] font-bold">+1,250 views</div>
                  <div className="text-[10px]" style={{ color: C.muted }}>2 min ago</div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>multysmm.app/order</div>
              </div>

              <div className="rounded-xl px-3 py-2.5 mb-5 text-[12px] font-mono truncate"
                style={{ background: '#fff', border: `1px solid ${C.line}`, color: C.ink2 }}>
                https://instagram.com/p/Cx9...
              </div>

              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {[
                  { l: 'Views', v: '10K', c: C.orange },
                  { l: 'Likes', v: '800', c: C.magenta },
                  { l: 'Comments', v: '50', c: C.purple },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl p-3 text-center" style={{ background: '#fff', border: `1px solid ${C.line}` }}>
                    <div className="text-[11px]" style={{ color: C.muted }}>{s.l}</div>
                    <div className="text-[20px] font-extrabold mt-0.5" style={{ color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>

              <svg viewBox="0 0 320 100" className="w-full h-24">
                <defs>
                  <linearGradient id="curve" x1="0" x2="1">
                    <stop offset="0%" stopColor={C.purple} />
                    <stop offset="100%" stopColor={C.pink} />
                  </linearGradient>
                  <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={C.purple} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={C.purple} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 80 C 60 78, 100 60, 160 35 S 260 20, 320 28 L 320 100 L 0 100 Z" fill="url(#fill)" />
                <path d="M0 80 C 60 78, 100 60, 160 35 S 260 20, 320 28" stroke="url(#curve)" strokeWidth="2.5" fill="none" />
              </svg>

              <div className="flex items-center justify-between mt-2 text-[11px]" style={{ color: C.muted }}>
                <span>Now</span><span>+6h</span><span>+12h</span><span>+24h</span>
              </div>

              <div className="absolute -bottom-4 -right-4 rounded-2xl px-3 py-2 flex items-center gap-2"
                style={{ background: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 10px 30px rgba(11,11,22,.10)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.lilac }}>
                  <Brain className="w-4 h-4" style={{ color: C.purple }} />
                </div>
                <div className="leading-tight">
                  <div className="text-[12px] font-bold">AI scheduling</div>
                  <div className="text-[10px]" style={{ color: C.muted }}>Optimized curve</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8" style={{ background: C.bgSoft }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Eyebrow>Core Features</Eyebrow>
            <h2 className="mt-4 text-[2rem] sm:text-[3rem] lg:text-[3.4rem] font-black leading-[1.02] tracking-[-0.035em]">
              Built for Speed, <span style={{ fontFamily: C.serif, fontStyle: 'italic', fontWeight: 400 }}>Powered</span><br />
              by <span style={{ fontFamily: C.serif, fontStyle: 'italic', fontWeight: 400, background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligence</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: Brain, t: 'AI Delivery Assist', d: 'Every order is paced by AI — analyzing peak hours, jitter and audience timezone for natural growth.' },
              { icon: Zap, t: 'Instant Start', d: 'Orders start within 60 seconds. No waiting, no queues — straight into delivery.' },
              { icon: Wand2, t: 'Visual Customizer', d: 'Tune quantity, speed, and spread with live curve preview before you ever press order.' },
              { icon: Shuffle, t: 'Multi-Provider Routing', d: 'We rotate across top-tier providers automatically so you always get the fastest, safest source.' },
              { icon: Layers, t: 'Engagement Bundles', d: 'Pre-built packs for Reels, Shorts, Stories and viral campaigns — one click, done.' },
              { icon: Shield, t: 'Account Safety First', d: 'Human-pace patterns, ±50% variance and night slowdown — zero account bans reported.' },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl p-6 transition-all hover:-translate-y-1"
                style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: '0 4px 20px rgba(11,11,22,.04)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: C.lilac }}>
                  <f.icon className="w-5 h-5" style={{ color: C.purple }} />
                </div>
                <h3 className="text-[16px] font-bold mb-2">{f.t}</h3>
                <p className="text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY US — comparison ═══ */}
      <section id="why" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Eyebrow>Why MultySMM</Eyebrow>
            <h2 className="mt-4 text-[2rem] sm:text-[3rem] lg:text-[3.4rem] font-black leading-[1.02] tracking-[-0.035em]">
              We're Building Trust &<br />
              <span style={{ fontFamily: C.serif, fontStyle: 'italic', fontWeight: 400, background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Brand Personality</span>
            </h2>
          </div>

          <div className="relative grid md:grid-cols-2 gap-5">
            {/* OLD */}
            <div className="rounded-3xl p-7 sm:p-8 relative"
              style={{ background: C.card, border: `1.5px dashed rgba(236,72,153,.35)` }}>
              <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: '#FEE2E2', color: '#DC2626' }}>
                <X className="w-3 h-3" /> OLD WAY
              </span>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: C.muted }}>Regular Panels</div>
              <h3 className="text-[22px] font-extrabold mb-6 line-through opacity-80" style={{ textDecorationColor: '#EF4444' }}>Bot-pattern delivery</h3>
              <div className="space-y-3">
                {[
                  'Same quantity each batch — bot pattern visible',
                  'Fixed intervals, no variance',
                  '24/7 dumping looks unnatural',
                  'Account flags & bans common',
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: '#FEE2E2' }}>
                      <X className="w-3 h-3" style={{ color: '#DC2626' }} />
                    </div>
                    <span className="text-[13.5px]" style={{ color: C.ink2 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* VS badge */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full items-center justify-center z-10 text-white font-black text-[14px]"
              style={{ background: '#0B0B16', boxShadow: '0 10px 30px rgba(0,0,0,.25)' }}>VS</div>

            {/* NEW */}
            <div className="rounded-3xl p-7 sm:p-8 relative text-white overflow-hidden"
              style={{ background: GRADIENT, boxShadow: '0 30px 80px -20px rgba(124,58,237,.45)' }}>
              <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,.2)', color: '#fff', backdropFilter: 'blur(8px)' }}>
                <Sparkles className="w-3 h-3" /> THE NEW WAY
              </span>
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] mb-3 px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,.18)' }}>MultySMM</div>
              <h3 className="text-[22px] font-extrabold mb-6">AI-organic delivery</h3>
              <div className="space-y-3">
                {[
                  'Random variance — looks like real humans',
                  'AI-jittered timing — undetectable',
                  'Peak hours + night slowdown built-in',
                  '100% safe — zero account bans',
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'rgba(255,255,255,.22)' }}>
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[13.5px]">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-10 rounded-3xl p-1 relative overflow-hidden"
            style={{ background: GRADIENT }}>
            <div className="rounded-[22px] grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: C.line }}>
              {[
                { n: '01', icon: Users, v: '2,400+', l: 'Active Creators' },
                { n: '02', icon: Package, v: '50K+', l: 'Orders Delivered' },
                { n: '03', icon: Target, v: '99.9%', l: 'Success Rate' },
                { n: '04', icon: Zap, v: '24/7', l: 'Live Support' },
              ].map((s) => (
                <div key={s.l} className="p-6 sm:p-7 text-center" style={{ background: C.card }}>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>{s.n}</div>
                  <s.icon className="w-6 h-6 mx-auto mb-2.5" style={{ color: C.ink2 }} />
                  <div className="text-[28px] sm:text-[34px] font-black leading-none"
                    style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {s.v}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-widest mt-2.5" style={{ color: C.muted }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-[32px] text-center py-16 sm:py-20 px-6 sm:px-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #FAF5FF 0%, #FDF2F8 100%)', border: `1px solid ${C.line}` }}>
          <div aria-hidden className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(124,58,237,.25), transparent 70%)', filter: 'blur(40px)' }} />
          <div className="relative">
            <Eyebrow>Start Today</Eyebrow>
            <h2 className="mt-4 text-[2rem] sm:text-[3rem] font-black leading-[1.02] tracking-[-0.035em] mb-5">
              Ready to grow <span style={{ fontFamily: C.serif, fontStyle: 'italic', fontWeight: 400, background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>smarter?</span>
            </h2>
            <p className="text-[15px] sm:text-[16.5px] mb-9 max-w-md mx-auto" style={{ color: C.ink2 }}>
              Join 2,400+ creators using MultySMM's AI engine. No credit card required.
            </p>
            <Link to="/auth" className="inline-flex h-13 px-8 rounded-full text-[14.5px] font-bold text-white items-center gap-2"
              style={{ background: GRADIENT, boxShadow: '0 14px 30px rgba(124,58,237,.4)' }}>
              Create free account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8" style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center mb-4">
                <img src="/logo.png" alt="MultySMM" className="h-10 w-auto object-contain" />
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
                The AI-powered SMM panel for creators who want real growth without risking their accounts.
              </p>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Product</h4>
              <div className="space-y-2.5">
                <a href="#features" className="block text-[13.5px]" style={{ color: C.ink }}>Features</a>
                <Link to="/api-access" className="block text-[13.5px]" style={{ color: C.ink }}>API</Link>
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Company</h4>
              <div className="space-y-2.5">
                <Link to="/about" className="block text-[13.5px]" style={{ color: C.ink }}>About</Link>
                <Link to="/contact" className="block text-[13.5px]" style={{ color: C.ink }}>Contact</Link>
                <Link to="/support" className="block text-[13.5px]" style={{ color: C.ink }}>Support</Link>
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Legal</h4>
              <div className="space-y-2.5">
                <Link to="/terms" className="block text-[13.5px]" style={{ color: C.ink }}>Terms</Link>
                <Link to="/privacy" className="block text-[13.5px]" style={{ color: C.ink }}>Privacy</Link>
                <Link to="/refund" className="block text-[13.5px]" style={{ color: C.ink }}>Refunds</Link>
                <Link to="/cookies" className="block text-[13.5px]" style={{ color: C.ink }}>Cookies</Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6" style={{ borderTop: `1px solid ${C.line}` }}>
            <p className="text-[12.5px]" style={{ color: C.muted }}>© {new Date().getFullYear()} MultySMM — All rights reserved.</p>
            <div className="flex items-center gap-5 text-[12.5px] font-medium" style={{ color: C.muted }}>
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> SSL Secured</span>
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> 99.9% Uptime</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
