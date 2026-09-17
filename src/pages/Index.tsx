import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Brain, Zap, Wand2, Layers, Shield, Shuffle,
  CheckCircle2, Instagram, Youtube, Music2, Twitter, Users,
  Package, Target, Activity, BarChart3, Rocket, Globe2, Lock, Menu, X,
} from 'lucide-react';
import { PageMeta } from '@/components/seo/PageMeta';

// MultySMM — Ultra Bold palette (electric blue / hot red / sun yellow)
const C = {
  bg: '#F4F5FF',
  ink: '#0B1030',
  ink2: '#4A5170',
  muted: '#8C93B5',
  line: 'rgba(59,46,240,.12)',
  card: '#FFFFFF',
  blue: '#3B2EF0',
  magenta: '#F5364B',
  lime: '#FFC629',
  blueSoft: '#EEEDFF',
  magentaSoft: '#FFEDEF',
  limeSoft: '#FFF6DE',
  display: "'Syne', system-ui, sans-serif",
  sans: "'Plus Jakarta Sans', system-ui, sans-serif",
};

const GRADIENT = 'linear-gradient(120deg, #3B2EF0 0%, #F5364B 58%, #FFC629 100%)';
const TRI = [C.blue, C.magenta, C.lime];
const TRI_SOFT = [C.blueSoft, C.magentaSoft, C.limeSoft];

const gradientText = {
  background: 'linear-gradient(100deg, #3B2EF0 0%, #F5364B 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
} as React.CSSProperties;


const Eyebrow: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.blue }) => (
  <div className="inline-flex items-center gap-2 text-[11px] sm:text-[12px] font-extrabold uppercase tracking-[0.2em]" style={{ color }}>
    <Sparkles className="w-3.5 h-3.5" /> {children}
  </div>
);

const Index = () => {
  const [prompt, setPrompt] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: C.bg, color: C.ink, fontFamily: C.sans }}>
      <PageMeta
        title="MultySMM — AI-Powered Social Media Growth Panel"
        description="Paste your post link, pick what to grow, and let MultySMM deliver real, human-paced engagement — AI-scheduled and 100% safe."
        canonicalPath="/"
        breadcrumbs={[{ name: 'Home', path: '/' }]}
      />

      {/* colourful ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-[8%] w-[70vw] max-w-[720px] h-[560px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(59,46,240,.26), transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute -top-24 right-[6%] w-[65vw] max-w-[620px] h-[520px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(245,54,75,.22), transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute top-[58%] left-1/2 -translate-x-1/2 w-[80vw] max-w-[700px] h-[480px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(255,198,41,.28), transparent 70%)', filter: 'blur(60px)' }} />
      </div>


      {/* ═══ NAV ═══ */}
      <nav className="sticky top-2 sm:top-4 z-50 w-full px-3 sm:px-4">
        <div className="max-w-6xl mx-auto rounded-3xl sm:rounded-full"
          style={{ background: 'rgba(255,255,255,.90)', backdropFilter: 'blur(20px) saturate(180%)', border: `1px solid ${C.line}`, boxShadow: '0 12px 34px rgba(59,46,240,.10)' }}>
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6">
            <Link to="/" className="flex items-center shrink-0">
              <img src="/logo.png" alt="MultySMM" className="h-9 sm:h-12 lg:h-14 w-auto object-contain" />
            </Link>
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {[['Features', '#features'], ['How it works', '#how'], ['Why us', '#why'], ['FAQ', '#faq']].map(([t, h]) => (
                <a key={t} href={h} className="text-[13.5px] font-semibold whitespace-nowrap transition-colors hover:text-[#3B2EF0]" style={{ color: C.ink2 }}>{t}</a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Link to="/auth" className="hidden sm:inline-flex h-9 px-3 items-center text-[13.5px] font-bold" style={{ color: C.ink }}>
                Log in
              </Link>
              <Link to="/auth" className="h-9 sm:h-10 px-4 sm:px-5 rounded-full text-[12px] sm:text-[13px] font-extrabold text-white inline-flex items-center gap-1.5 transition-transform hover:scale-105 whitespace-nowrap"
                style={{ background: GRADIENT, boxShadow: '0 12px 26px rgba(245,54,75,.35)' }}>
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                className="md:hidden w-9 h-9 rounded-xl inline-flex items-center justify-center"
                style={{ background: C.blueSoft, color: C.blue, border: `1px solid ${C.line}` }}>
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="md:hidden px-3 pb-3 flex flex-col gap-1" style={{ borderTop: `1px solid ${C.line}` }}>
              {[['Features', '#features'], ['How it works', '#how'], ['Why us', '#why'], ['FAQ', '#faq']].map(([t, h]) => (
                <a key={t} href={h} onClick={() => setMenuOpen(false)}
                  className="mt-1 px-3 py-2.5 rounded-xl text-[14px] font-bold"
                  style={{ color: C.ink, background: '#F8FAFF' }}>{t}</a>
              ))}
              <Link to="/auth" onClick={() => setMenuOpen(false)} className="mt-1 px-3 py-2.5 rounded-xl text-[14px] font-bold" style={{ color: C.blue, background: C.blueSoft }}>
                Log in
              </Link>
            </div>
          )}
        </div>
      </nav>


      <main>
        {/* ═══ HERO ═══ */}
        <section className="pt-14 sm:pt-20 lg:pt-24 pb-14 sm:pb-20 text-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7"
              style={{ background: C.blueSoft, border: '1px solid rgba(59,46,240,.20)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.blue }} />
              <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em] uppercase" style={{ color: C.blue }}>
                The Next-Gen Growth Engine
              </span>
            </div>

            <h1 className="text-[2.1rem] xs:text-[2.5rem] sm:text-[3.6rem] lg:text-[5rem] break-words font-extrabold leading-[0.98] tracking-[-0.045em] mb-7"
              style={{ fontFamily: C.display }}>
              Explode your social presence with{' '}
              <span style={gradientText}>AI Precision</span>
            </h1>


            <p className="text-[15px] sm:text-[18px] leading-[1.65] mb-12 max-w-2xl mx-auto" style={{ color: C.ink2 }}>
              Paste your link, select growth parameters, and watch MultySMM deliver{' '}
              <span className="font-bold" style={{ color: C.ink }}>human-paced engagement</span>{' '}
              designed for safety and speed.
            </p>

            {/* ═══ AI GROWTH ENGINE ═══ */}
            <div className="max-w-3xl mx-auto relative">
              <div aria-hidden className="absolute -inset-1 rounded-[36px] -z-10"
                style={{ background: GRADIENT, filter: 'blur(28px)', opacity: 0.28 }} />
              <div className="rounded-[32px] p-2 relative text-left"
                style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: '0 32px 64px -16px rgba(59,46,240,.22)' }}>
                <div className="absolute -top-3 right-5 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-[0.18em] text-[#0B1030]"
                  style={{ background: C.lime, boxShadow: '0 8px 18px rgba(255,198,41,.45)' }}>
                  AI Powered
                </div>

                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg" style={{ background: C.blueSoft }}>
                      <Zap className="w-4 h-4" style={{ color: C.blue }} />
                    </div>
                    <span className="text-[11px] font-extrabold tracking-[0.18em] uppercase" style={{ color: C.ink }}>
                      AI Growth Engine
                    </span>
                  </div>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.magenta }} />
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="I want to grow my Instagram reel — 10k views, 800 likes, 50 comments"
                  className="w-full min-h-[110px] sm:min-h-[130px] resize-none rounded-3xl p-5 sm:p-6 text-[15px] sm:text-[16.5px] leading-relaxed font-medium outline-none transition-all focus:bg-white"
                  style={{ background: '#F8FAFF', color: C.ink, border: `1px solid ${C.line}` }}
                />

                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 p-3">
                  <div className="flex flex-wrap items-center gap-2 flex-grow">
                    {[
                      { icon: Instagram, label: 'Instagram', color: C.blue, soft: C.blueSoft, active: true },
                      { icon: Music2, label: 'TikTok', color: C.magenta, soft: C.magentaSoft },
                      { icon: Youtube, label: 'YouTube', color: '#EF4444', soft: '#FEF2F2' },
                      { icon: Twitter, label: 'Twitter', color: '#0EA5E9', soft: '#F0F9FF' },
                    ].map((p) => (
                      <button key={p.label}
                        className="h-10 px-3.5 rounded-2xl flex items-center gap-2 text-[12px] font-extrabold transition-all hover:-translate-y-0.5"
                        style={{
                          background: p.soft,
                          color: p.color,
                          border: p.active ? `2px solid ${p.color}` : `1px solid ${p.color}33`,
                        }}>
                        <p.icon className="w-3.5 h-3.5" /> {p.label}
                      </button>
                    ))}
                  </div>
                  <Link to="/auth"
                    className="group w-full lg:w-auto h-12 px-8 rounded-2xl text-[14px] font-extrabold text-white inline-flex items-center justify-center gap-2.5 transition-all hover:scale-[1.03] active:scale-95"
                    style={{ background: C.blue, boxShadow: '0 14px 30px rgba(59,46,240,.35)' }}>
                    Generate
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* prompt examples */}
            <div className="mt-9 flex flex-wrap justify-center gap-2.5">
              {[
                { t: '🎬  Instagram reel — 10k views, 800 likes', c: C.blue, s: C.blueSoft },
                { t: '▶️  YouTube — 5k views, 300 likes', c: C.magenta, s: C.magentaSoft },
                { t: '🎵  TikTok — 20k views, 1.5k likes', c: '#B87500', s: C.limeSoft },
              ].map((x) => (
                <button key={x.t} className="text-[12.5px] font-bold px-4 py-2 rounded-full transition-transform hover:-translate-y-0.5"
                  style={{ background: x.s, color: x.c, border: `1px solid ${x.c}26` }}>
                  {x.t}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FEATURES — BENTO GRID ═══ */}
        <section id="features" className="pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <Eyebrow>Core Features</Eyebrow>
              <h2 className="mt-4 text-[1.7rem] sm:text-[2.4rem] lg:text-[2.8rem] font-extrabold leading-[1.05] tracking-[-0.03em]"
                style={{ fontFamily: C.display }}>
                Built for Speed, Powered<br />
                by <span style={gradientText}>Intelligence</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-5 md:auto-rows-[236px]">
              {/* wide white tile */}
              <div className="md:col-span-2 rounded-[2rem] p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group transition-all hover:-translate-y-1"
                style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: '0 18px 40px rgba(59,46,240,.08)' }}>
                <div aria-hidden className="absolute top-0 right-0 p-8 opacity-10 transition-opacity group-hover:opacity-20">
                  <div className="w-32 h-32 rounded-full" style={{ border: `8px solid ${C.blue}` }} />
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: C.blueSoft }}>
                  <BarChart3 className="w-6 h-6" style={{ color: C.blue }} />
                </div>
                <div>
                  <h3 className="text-[22px] font-extrabold mb-2" style={{ fontFamily: C.display }}>Live Performance Tracking</h3>
                  <p className="text-[13.5px] leading-relaxed max-w-sm" style={{ color: C.ink2 }}>
                    Monitor every order with millisecond precision, live curves and AI-driven predictive insights.
                  </p>
                </div>
              </div>

              {/* magenta tile */}
              <div className="rounded-[2rem] p-7 flex flex-col justify-between text-white transition-all hover:-translate-y-1"
                style={{ background: C.magenta, boxShadow: '0 20px 44px rgba(245,54,75,.32)' }}>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.22)' }}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Turbo</span>
                </div>
                <div>
                  <h3 className="text-[20px] font-extrabold mb-1" style={{ fontFamily: C.display }}>Auto-Scale</h3>
                  <p className="text-[12.5px] text-white/85">Full-throttle growth automation, running 24/7.</p>
                </div>
              </div>

              {/* lime hover tile */}
              <div className="rounded-[2rem] p-7 flex flex-col justify-center items-center text-center group transition-all hover:-translate-y-1 hover:bg-[#FFC629]"
                style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors group-hover:bg-white"
                  style={{ background: C.limeSoft }}>
                  <span className="text-[18px] font-extrabold" style={{ color: '#B87500' }}>99%</span>
                </div>
                <h3 className="text-[18px] font-extrabold transition-colors group-hover:text-white" style={{ fontFamily: C.display }}>Success Rate</h3>
              </div>

              {/* onboarding tile */}
              <div className="rounded-[2rem] p-7 flex flex-col justify-between transition-all hover:-translate-y-1"
                style={{ background: C.card, border: `1px solid ${C.line}` }}>
                <div className="space-y-3">
                  {[
                    { n: '1', t: 'Paste your link', c: C.blue, s: C.blueSoft },
                    { n: '2', t: 'Pick what to grow', c: C.magenta, s: C.magentaSoft },
                    { n: '3', t: 'Watch it deliver', c: '#B87500', s: C.limeSoft },
                  ].map((s) => (
                    <div key={s.n} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold"
                        style={{ background: s.s, color: s.c }}>{s.n}</div>
                      <span className="text-[12px] font-bold uppercase tracking-tight" style={{ color: C.muted }}>{s.t}</span>
                    </div>
                  ))}
                </div>
                <h3 className="text-[19px] font-extrabold" style={{ fontFamily: C.display }}>Streamlined Onboarding</h3>
              </div>

              {/* dark wide tile */}
              <div className="md:col-span-3 rounded-[2rem] p-7 sm:p-8 flex flex-col md:flex-row items-center gap-7 relative overflow-hidden"
                style={{ background: '#0F172A' }}>
                <div aria-hidden className="absolute top-0 right-0 w-64 h-64 rounded-full" style={{ background: C.blue, opacity: 0.18, filter: 'blur(90px)' }} />
                <div aria-hidden className="absolute bottom-0 left-0 right-0 h-1" style={{ background: GRADIENT }} />
                <div className="md:flex-1 relative">
                  <h3 className="text-white text-[24px] sm:text-[28px] font-extrabold mb-4" style={{ fontFamily: C.display }}>Why choose MultySMM?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}>
                      <p className="font-extrabold text-[16px] flex items-center gap-2" style={{ color: C.lime }}><Globe2 className="w-4 h-4" /> Global</p>
                      <p className="text-[12px] mt-1" style={{ color: C.muted }}>120+ countries targeted.</p>
                    </div>
                    <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}>
                      <p className="font-extrabold text-[16px] flex items-center gap-2" style={{ color: C.magenta }}><Lock className="w-4 h-4" /> Secure</p>
                      <p className="text-[12px] mt-1" style={{ color: C.muted }}>Safe & encrypted delivery.</p>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-64 rounded-2xl flex items-center justify-center p-6 text-center"
                  style={{ background: GRADIENT, boxShadow: '0 18px 40px rgba(245,54,75,.35)' }}>
                  <p className="text-white text-[17px] font-extrabold italic" style={{ fontFamily: C.display }}>
                    "The ultimate unfair advantage in social media."
                  </p>
                </div>
              </div>

              {/* blue rocket strip */}
              <div className="md:col-span-4 md:row-span-1 rounded-[2rem] p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 text-white transition-all hover:-translate-y-1"
                style={{ background: C.blue, boxShadow: '0 20px 44px rgba(59,46,240,.30)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,.22)' }}>
                  <Rocket className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[21px] font-extrabold mb-1" style={{ fontFamily: C.display }}>Instant Start</h3>
                  <p className="text-[13px] text-white/85">Orders begin within 60 seconds — no queues, no waiting rooms.</p>
                </div>
                <Link to="/auth" className="h-11 px-6 rounded-full text-[13px] font-extrabold inline-flex items-center gap-2 shrink-0"
                  style={{ background: '#FFFFFF', color: C.blue }}>
                  Start now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* remaining features as colourful cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-5">
              {[
                { icon: Brain, t: 'AI Delivery Assist', d: 'Every order is paced by AI — peak hours, jitter and audience timezone for natural growth.' },
                { icon: Wand2, t: 'Visual Customizer', d: 'Tune quantity, speed and spread with a live curve preview before you press order.' },
                { icon: Shuffle, t: 'Multi-Provider Routing', d: 'We rotate across top-tier providers automatically for the fastest, safest source.' },
                { icon: Layers, t: 'Engagement Bundles', d: 'Pre-built packs for Reels, Shorts, Stories and viral campaigns — one click, done.' },
                { icon: Shield, t: 'Account Safety First', d: 'Human-pace patterns, ±50% variance and night slowdown — zero bans reported.' },
                { icon: Activity, t: 'Always-On Monitoring', d: 'Health checks every minute so a stalled run is retried before you notice.' },
              ].map((f, i) => (
                <div key={f.t} className="rounded-[1.75rem] p-6 transition-all hover:-translate-y-1"
                  style={{ background: C.card, border: `1px solid ${TRI[i % 3]}22`, boxShadow: `0 14px 32px ${TRI[i % 3]}14` }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: TRI_SOFT[i % 3] }}>
                    <f.icon className="w-5 h-5" style={{ color: TRI[i % 3] }} />
                  </div>
                  <h3 className="text-[16.5px] font-extrabold mb-2" style={{ fontFamily: C.display }}>{f.t}</h3>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <Eyebrow color={C.magenta}>How it works</Eyebrow>
              <h2 className="mt-4 text-[1.7rem] sm:text-[2.4rem] lg:text-[2.8rem] font-extrabold leading-[1.05] tracking-[-0.03em]"
                style={{ fontFamily: C.display }}>
                From link to growth in <span style={gradientText}>3 simple steps</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
              {[
                { n: '01', t: 'Paste your post link', d: 'Drop any Instagram, YouTube or TikTok URL — that is all we need to begin.' },
                { n: '02', t: 'Pick what to grow', d: 'Choose views, likes, comments, saves and shares. Set quantity for each.' },
                { n: '03', t: 'Watch it deliver', d: 'AI plans the curve, jitters timing and delivers naturally over hours.' },
              ].map((s, i) => (
                <div key={s.n} className="rounded-[1.75rem] p-7 transition-all hover:-translate-y-1"
                  style={{ background: C.card, border: `1px solid ${TRI[i]}26`, boxShadow: `0 16px 36px ${TRI[i]}16` }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[18px] font-extrabold mb-5"
                    style={{ background: TRI_SOFT[i], color: i === 2 ? '#B87500' : TRI[i], fontFamily: C.display }}>
                    {s.n}
                  </div>
                  <h3 className="text-[18px] font-extrabold mb-2" style={{ fontFamily: C.display }}>{s.t}</h3>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>{s.d}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link to="/auth" className="inline-flex h-12 px-7 rounded-full text-[14px] font-extrabold text-white items-center gap-2 transition-transform hover:scale-105"
                style={{ background: GRADIENT, boxShadow: '0 14px 30px rgba(59,46,240,.32)' }}>
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ WHY US — stats ═══ */}
        <section id="why" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <Eyebrow color="#B87500">Why MultySMM</Eyebrow>
              <h2 className="mt-4 text-[1.7rem] sm:text-[2.4rem] lg:text-[2.8rem] font-extrabold leading-[1.05] tracking-[-0.03em]"
                style={{ fontFamily: C.display }}>
                Real numbers, <span style={gradientText}>real growth</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {[
                { icon: Users, v: '2,400+', l: 'Active Creators', c: C.blue, s: C.blueSoft },
                { icon: Package, v: '50K+', l: 'Orders Delivered', c: C.magenta, s: C.magentaSoft },
                { icon: Target, v: '99.9%', l: 'Success Rate', c: '#B87500', s: C.limeSoft },
                { icon: Zap, v: '24/7', l: 'Live Support', c: C.blue, s: C.blueSoft },
              ].map((s) => (
                <div key={s.l} className="rounded-[1.75rem] p-6 text-center transition-all hover:-translate-y-1"
                  style={{ background: C.card, border: `1px solid ${s.c}26`, boxShadow: `0 16px 36px ${s.c}14` }}>
                  <div className="w-11 h-11 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: s.s }}>
                    <s.icon className="w-5 h-5" style={{ color: s.c }} />
                  </div>
                  <div className="text-[26px] sm:text-[32px] font-extrabold leading-none" style={{ color: s.c, fontFamily: C.display }}>{s.v}</div>
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] mt-2.5" style={{ color: C.muted }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* old vs new */}
            <div className="grid md:grid-cols-2 gap-5 mt-6">
              <div className="rounded-[2rem] p-7 sm:p-8" style={{ background: C.card, border: '1.5px dashed rgba(245,54,75,.35)' }}>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] mb-3" style={{ color: C.muted }}>Regular Panels</div>
                <h3 className="text-[21px] font-extrabold mb-5" style={{ fontFamily: C.display }}>Bot-pattern delivery</h3>
                <div className="space-y-3">
                  {['Same quantity each batch', 'Fixed intervals, no variance', '24/7 dumping looks unnatural', 'Account flags & bans common'].map((t) => (
                    <div key={t} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: '#FEE2E2' }}>
                        <span className="text-[11px] font-black" style={{ color: '#DC2626' }}>×</span>
                      </div>
                      <span className="text-[13.5px]" style={{ color: C.ink2 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] p-7 sm:p-8 text-white relative overflow-hidden"
                style={{ background: GRADIENT, boxShadow: '0 28px 64px -18px rgba(59,46,240,.45)' }}>
                <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] mb-3 px-3 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,.22)' }}>MultySMM</div>
                <h3 className="text-[21px] font-extrabold mb-5" style={{ fontFamily: C.display }}>AI-organic delivery</h3>
                <div className="space-y-3">
                  {['Random variance — looks like real humans', 'AI-jittered timing — undetectable', 'Peak hours + night slowdown built-in', '100% safe — zero account bans'].map((t) => (
                    <div key={t} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'rgba(255,255,255,.25)' }}>
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[13.5px]">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section id="faq" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="mt-4 text-[1.7rem] sm:text-[2.4rem] font-extrabold leading-[1.05] tracking-[-0.03em]" style={{ fontFamily: C.display }}>
                Frequently asked <span style={gradientText}>questions</span>
              </h2>
            </div>
            <div className="space-y-4">
              {[
                { q: 'Is it safe for my account?', a: 'Yes. We use human-pace patterns, ±50% variance and night slowdown so delivery always looks organic.', c: C.blue },
                { q: 'How fast are the results?', a: 'Most orders start within 60 seconds and then deliver gradually over hours for a natural curve.', c: C.magenta },
                { q: 'Which platforms are supported?', a: 'Instagram, YouTube, TikTok, Facebook, X (Twitter), Spotify and more.', c: '#B87500' },
                { q: 'Do I need a credit card to start?', a: 'No. Sign-up is free — add funds to your wallet only when you want to place an order.', c: C.blue },
              ].map((f) => (
                <div key={f.q} className="rounded-[1.5rem] p-6 text-left"
                  style={{ background: C.card, border: `1px solid ${f.c}26`, boxShadow: `0 12px 28px ${f.c}12` }}>
                  <p className="text-[15.5px] font-extrabold mb-1.5" style={{ color: f.c, fontFamily: C.display }}>{f.q}</p>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: C.ink2 }}>{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto rounded-[32px] text-center py-14 sm:py-18 px-6 sm:px-10 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #FDF4FF 55%, #F7FEE7 100%)', border: `1px solid ${C.line}` }}>
            <div aria-hidden className="absolute -top-24 left-[18%] w-[400px] h-[300px] rounded-full"
              style={{ background: 'radial-gradient(closest-side, rgba(59,46,240,.28), transparent 70%)', filter: 'blur(40px)' }} />
            <div aria-hidden className="absolute -top-24 right-[14%] w-[400px] h-[300px] rounded-full"
              style={{ background: 'radial-gradient(closest-side, rgba(245,54,75,.28), transparent 70%)', filter: 'blur(40px)' }} />
            <div className="relative">
              <Eyebrow>Start Today</Eyebrow>
              <h2 className="mt-4 text-[1.7rem] sm:text-[2.4rem] font-extrabold leading-[1.05] tracking-[-0.03em] mb-5" style={{ fontFamily: C.display }}>
                Ready to grow <span style={gradientText}>smarter?</span>
              </h2>
              <p className="text-[15px] sm:text-[16.5px] mb-8 max-w-md mx-auto" style={{ color: C.ink2 }}>
                Join 2,400+ creators using MultySMM's AI engine. No credit card required.
              </p>
              <Link to="/auth" className="inline-flex h-14 px-9 rounded-full text-[16px] font-extrabold text-white items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                style={{ background: GRADIENT, boxShadow: '0 18px 40px rgba(245,54,75,.42)', fontFamily: C.display }}>
                Scale Your Brand Now <ArrowRight className="w-4 h-4" />
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
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Product</h4>
              <div className="space-y-2.5">
                <a href="#features" className="block text-[13.5px]" style={{ color: C.ink }}>Features</a>
                <Link to="/api-access" className="block text-[13.5px]" style={{ color: C.ink }}>API</Link>
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Company</h4>
              <div className="space-y-2.5">
                <Link to="/about" className="block text-[13.5px]" style={{ color: C.ink }}>About</Link>
                <Link to="/contact" className="block text-[13.5px]" style={{ color: C.ink }}>Contact</Link>
                <Link to="/support" className="block text-[13.5px]" style={{ color: C.ink }}>Support</Link>
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest mb-4" style={{ color: C.muted }}>Legal</h4>
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
            <div className="flex items-center gap-5 text-[12.5px] font-semibold" style={{ color: C.muted }}>
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
