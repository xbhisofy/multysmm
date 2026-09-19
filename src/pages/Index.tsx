import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ChevronDown, Clock3, Facebook, Headphones, Instagram, Menu,
  Minus, Play, Plus, Send, ShieldCheck, Sparkles, Twitter, X, Youtube, Zap,
} from 'lucide-react';
import { PageMeta } from '@/components/seo/PageMeta';
import './smm-home.css';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

const features = [
  {
    icon: Zap,
    title: 'Real People, Not Bots',
    text: 'Every like, view and follow comes from real accounts and creator-driven clipping — never bot farms or fake traffic.',
  },
  {
    icon: ShieldCheck,
    title: 'Human-Paced Delivery',
    text: 'Engagement arrives in natural waves that match how a real post spreads, so your growth curve stays believable.',
  },
  {
    icon: Headphones,
    title: 'Built for Serious Growth',
    text: 'Live tracking, smart routing and 24/7 support — the heavyweight setup ordinary panels simply cannot match.',
  },
];

const platforms = ['YouTube', 'Instagram', 'Twitter', 'TikTok', 'Telegram', 'Facebook'];

const services = [
  { icon: Instagram, name: 'Instagram', tags: ['Real Followers', 'Organic Likes'], featured: true },
  { icon: Facebook, name: 'Facebook', tags: ['Page Reach', 'Comments'] },
  { icon: Youtube, name: 'YouTube', tags: ['Watch Time', 'Real Views'] },
  { icon: Twitter, name: 'Twitter', tags: ['Followers', 'Reposts'] },
  { icon: Send, name: 'Telegram', tags: ['Members', 'Reactions'] },
  { icon: Play, name: 'TikTok', tags: ['Clipping Reach', 'Views'] },
];

const faqs = [
  {
    q: 'How is this different from a normal SMM panel?',
    a: 'Normal panels resell bot numbers. We run real organic engagement — creator clipping and genuine accounts interacting with your content, delivered at human speed.',
  },
  {
    q: 'Is the engagement really organic?',
    a: 'Yes. Reach comes from real audiences and creator-led distribution. No bot bursts, no fake spikes, nothing that looks machine-made on your profile.',
  },
  {
    q: 'How do I start a campaign?',
    a: 'Add funds, paste your content link, pick the engagement type and volume, and launch. Progress updates live in your dashboard.',
  },
  {
    q: 'Is it safe for my account?',
    a: 'It is built to be. Delivery is spread naturally over time so platforms see normal growth, not a sudden unnatural jump.',
  },
  {
    q: 'How fast does it start?',
    a: 'Most campaigns begin within minutes. Bigger volumes are paced over hours or days so the growth stays organic.',
  },
  {
    q: 'Which payment methods do you support?',
    a: 'You can top up your wallet with UPI and popular payment options — balance is only used for campaigns you launch.',
  },
];

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div id="home" className="smm-home">
      <PageMeta
        title="MultySMM — Real Organic Engagement, Not Another SMM Panel"
        description="Get real organic engagement from genuine audiences and creator-led clipping. Human-paced delivery, live tracking and serious growth on every platform."
        canonicalPath="/"
        breadcrumbs={[{ name: 'Home', path: '/' }]}
      />

      {/* ================= NAV ================= */}
      <header className="smm-nav">
        <div className="smm-wrap flex min-h-[4.6rem] items-center justify-between gap-4">
          <Link to="/" aria-label="MultySMM home" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="h-9 w-9 rounded-xl object-cover" />
            <span className="text-base font-extrabold tracking-tight">MULTY<span className="smm-grad-text">SMM</span></span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map(({ label, href }, i) => (
              <a key={label} href={href} className={`smm-nav-link ${i === 0 ? 'is-active' : ''}`}>{label}</a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link to="/auth" className="smm-btn smm-btn-ghost">Login</Link>
            <Link to="/auth" className="smm-btn smm-btn-primary">Register</Link>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border lg:hidden"
            style={{ borderColor: 'hsl(var(--smm-line))' }}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t px-5 py-4 lg:hidden" style={{ borderColor: 'hsl(var(--smm-line))' }}>
            <div className="grid gap-1">
              {navLinks.map(({ label, href }) => (
                <a key={label} href={href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-[hsl(var(--smm-violet-soft))]">{label}</a>
              ))}
              <div className="mt-3 flex gap-3">
                <Link to="/auth" className="smm-btn smm-btn-ghost flex-1">Login</Link>
                <Link to="/auth" className="smm-btn smm-btn-primary flex-1">Register</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ================= HERO ================= */}
      <section className="smm-hero">
        <div className="smm-hero-grid" />
        <div className="smm-wrap relative z-10 flex flex-col items-center px-2 pb-10 pt-16 text-center md:pt-20">
          <span className="smm-kicker mb-6"><Sparkles className="h-3.5 w-3.5" /> Not an SMM panel. Real organic engagement.</span>
          <h1 className="max-w-3xl text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
            <span className="smm-grad-text">Real Organic Engagement</span>
            <br />
            From Real People
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-6 md:text-base" style={{ color: 'hsl(var(--smm-copy))' }}>
            Thousands of SMM panels sell bot numbers. We deliver genuine audience reach — creator-led clipping and real accounts engaging your content at human speed, on every platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="smm-btn smm-btn-primary">Start Growing Organically <ArrowRight className="h-4 w-4" /></Link>
            <a href="#services" className="smm-btn smm-btn-ghost">See How It Works</a>
          </div>
          <div className="smm-phone-scene">
            <div className="smm-phone">
              <div className="smm-phone-notch" />
              <div className="smm-phone-screen">
                <div className="smm-phone-title">Organic Reach</div>
                <div className="smm-phone-count">
                  24,816
                  <span>▲ +312% real engagement</span>
                </div>
                <svg className="smm-phone-chart" viewBox="0 0 260 150" fill="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="smmArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[30, 60, 90, 120].map((y) => (
                    <line key={y} x1="0" x2="260" y1={y} y2={y} stroke="#fff" strokeOpacity="0.12" strokeDasharray="3 5" />
                  ))}
                  <path
                    className="smm-graph-area"
                    d="M0 128 C 26 126 38 108 58 102 S 92 110 112 90 S 148 94 168 66 S 208 70 228 38 S 252 26 260 16 L 260 150 L 0 150 Z"
                    fill="url(#smmArea)"
                  />
                  <path
                    className="smm-graph-line"
                    d="M0 128 C 26 126 38 108 58 102 S 92 110 112 90 S 148 94 168 66 S 208 70 228 38 S 252 26 260 16"
                    stroke="#fff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle className="smm-graph-dot" cx="228" cy="38" r="5" fill="#fff" />
                  <circle className="smm-graph-dot" cx="228" cy="38" r="10" fill="#fff" opacity="0.25" />
                </svg>
              </div>
            </div>
            <span className="smm-live-chip"><span className="dot" /> Live organic delivery</span>
            <span className="smm-float-chip left"><Instagram className="h-3.5 w-3.5" style={{ color: 'hsl(var(--smm-violet))' }} /> +2,480 <span className="up">views</span></span>
            <span className="smm-float-chip right"><Zap className="h-3.5 w-3.5" style={{ color: 'hsl(150 75% 40%)' }} /> +916 <span className="up">likes</span></span>
          </div>
        </div>
      </section>

      {/* ================= STATS + PLATFORMS ================= */}
      <section className="smm-wrap -mt-2 pb-4">
        <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6">
          <div className="text-center">
            <div className="smm-stat-value">4516+</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--smm-copy))' }}>Creators Growing</div>
          </div>
          <div className="text-center">
            <div className="smm-stat-value">511516+</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--smm-copy))' }}>Organic Campaigns</div>
          </div>
          <div className="text-center">
            <div className="smm-stat-value">0%</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--smm-copy))' }}>Bot Traffic</div>
          </div>
        </div>
      </section>

      <section className="smm-platforms mt-10 py-7">
        <div className="smm-wrap flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {platforms.map((name) => (
            <span key={name} className="smm-platform"><span className="h-2 w-2 rounded-full" style={{ background: 'hsl(var(--smm-violet))' }} />{name}</span>
          ))}
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how" className="py-20 md:py-24" style={{ background: 'hsl(var(--smm-violet-soft) / 0.35)' }}>
        <div className="smm-wrap">
          <div className="mx-auto max-w-2xl text-center">
            <span className="smm-kicker mb-5"><Sparkles className="h-3.5 w-3.5" /> How it works</span>
            <h2 className="text-3xl leading-tight sm:text-4xl md:text-5xl">
              One link. <span className="smm-grad-text">Full engagement.</span> Delivered organically.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-6" style={{ color: 'hsl(var(--smm-copy))' }}>
              Paste your post link once. Views, likes, comments, saves and shares are all delivered automatically by AI —
              in patterns that look exactly like real users.
            </p>
          </div>

          <div className="smm-flow-card mx-auto mt-12 max-w-4xl">
            <div className="smm-link-bar">
              <span className="flex items-center gap-2.5 truncate"><LinkIcon className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--smm-violet-deep))' }} />https://instagram.com/p/your-post...</span>
              <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'hsl(var(--smm-violet-deep))' }}>1 link</span>
            </div>
            <div className="my-5 flex justify-center"><ArrowDown className="h-5 w-5" style={{ color: 'hsl(var(--smm-violet))' }} /></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {engagementTiles.map(({ icon: Icon, label }, i) => (
                <div key={label} className="smm-flow-tile" style={{ animationDelay: `${i * 0.18}s` }}>
                  <span className="ico"><Icon className="h-5 w-5" /></span>
                  <div>{label}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs" style={{ color: 'hsl(var(--smm-copy))' }}>
              Everything in one single order — pick and choose what you need.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {howSteps.map(({ icon: Icon, title, text }, i) => (
              <article key={title} className="smm-step-card">
                <span className="smm-step-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'hsl(var(--smm-violet-soft))', color: 'hsl(var(--smm-violet-deep))' }}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-extrabold" style={{ color: 'hsl(var(--smm-ink))' }}>{title}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: 'hsl(var(--smm-copy))' }}>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>



      {/* ================= FEATURES ================= */}
      <section id="pricing" className="smm-wrap py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="smm-kicker mb-5"><Sparkles className="h-3.5 w-3.5" /> The difference</span>
          <h2 className="text-3xl leading-tight sm:text-4xl md:text-5xl">Why creators leave <span className="smm-grad-text">ordinary panels</span></h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-6" style={{ color: 'hsl(var(--smm-copy))' }}>
            Bot numbers fade and hurt your reach. Real organic engagement compounds — and that is the only thing we deliver.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="smm-feature-card">
              <div className="smm-feature-icon"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-7 text-xl font-extrabold" style={{ color: '#fff' }}>{title}</h3>
              <p className="mt-3 text-sm leading-6" style={{ color: 'hsl(0 0% 100% / 0.85)' }}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section id="services" className="py-20 md:py-24" style={{ background: 'hsl(var(--smm-violet-soft) / 0.55)' }}>
        <div className="smm-wrap">
          <div className="mx-auto max-w-2xl text-center">
            <span className="smm-kicker mb-5"><Sparkles className="h-3.5 w-3.5" /> Platforms</span>
            <h2 className="text-3xl leading-tight sm:text-4xl md:text-5xl">Organic growth on <span className="smm-grad-text">every platform</span></h2>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-6" style={{ color: 'hsl(var(--smm-copy))' }}>
              Real audiences, creator clipping and natural pacing — pick your platform and launch in a few clicks.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-3">
            {services.map(({ icon: Icon, name, tags, featured }) => (
              <Link key={name} to="/auth" className={`smm-service-row ${featured ? 'is-featured' : ''}`}>
                <span className="flex items-center gap-3.5">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${featured ? 'bg-white/20' : ''}`} style={featured ? undefined : { background: 'hsl(var(--smm-violet-soft))', color: 'hsl(var(--smm-violet-deep))' }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-base font-extrabold">{name}</span>
                </span>
                <span className="flex items-center gap-2">
                  {tags.map((tag) => <span key={tag} className="smm-tag hidden sm:inline-flex">{tag}</span>)}
                  <ArrowRight className="h-4 w-4 opacity-60" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="smm-wrap py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="smm-kicker mb-5"><Sparkles className="h-3.5 w-3.5" /> FAQ</span>
          <h2 className="text-3xl leading-tight sm:text-4xl md:text-5xl">Questions about <span className="smm-grad-text">organic growth?</span></h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-6" style={{ color: 'hsl(var(--smm-copy))' }}>
            Quick answers about how real engagement works, safety, pacing and payments.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl gap-3 md:grid-cols-2 md:items-start">
          {faqs.map(({ q, a }, i) => {
            const open = openFaq === i;
            return (
              <div key={q} className="smm-faq-item" data-open={open}>
                <button
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                >
                  <span className="text-sm font-bold">{q}</span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: 'hsl(var(--smm-violet-soft))', color: 'hsl(var(--smm-violet-deep))' }}>
                    {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                {open && <p className="px-5 pb-5 text-sm leading-6" style={{ color: 'hsl(var(--smm-copy))' }}>{a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section id="contact" className="smm-wrap pb-20 md:pb-24">
        <div className="smm-cta relative z-0 px-6 py-16 text-center md:py-20">
          <div className="relative z-10 mx-auto max-w-2xl">
            <Clock3 className="mx-auto mb-5 h-8 w-8" style={{ color: '#fff' }} />
            <h2 className="text-3xl leading-tight sm:text-4xl md:text-5xl" style={{ color: '#fff' }}>Real growth starts in the next minute</h2>
            <p className="mx-auto mt-5 max-w-md text-sm leading-6" style={{ color: 'hsl(0 0% 100% / 0.85)' }}>
              Create your account, add funds and launch your first fully organic campaign from one dashboard.
            </p>
            <Link to="/auth" className="smm-btn mt-8 inline-flex" style={{ background: '#fff', color: 'hsl(var(--smm-violet-deep))' }}>
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="smm-footer py-14">
        <div className="smm-wrap grid gap-10 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="h-10 w-10 rounded-xl object-cover" />
              <strong className="text-lg font-extrabold">MULTY<span className="smm-grad-text">SMM</span></strong>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6" style={{ color: 'hsl(var(--smm-copy))' }}>
              Real organic engagement for creators and brands — genuine audiences, human pacing, zero bots.
            </p>
            <Link to="/auth" className="smm-btn smm-btn-primary mt-6">Get Started</Link>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h4 className="mb-4 text-sm font-extrabold">Product</h4>
              <div className="space-y-2.5 text-sm" style={{ color: 'hsl(var(--smm-copy))' }}>
                <a href="#services" className="block">Services</a>
                <a href="#faq" className="block">FAQ</a>
                <Link to="/api-access" className="block">API access</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-extrabold">Company</h4>
              <div className="space-y-2.5 text-sm" style={{ color: 'hsl(var(--smm-copy))' }}>
                <Link to="/about" className="block">About us</Link>
                <Link to="/contact" className="block">Contact</Link>
                <Link to="/support" className="block">Support</Link>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-extrabold">Legal</h4>
              <div className="space-y-2.5 text-sm" style={{ color: 'hsl(var(--smm-copy))' }}>
                <Link to="/terms" className="block">Terms</Link>
                <Link to="/privacy" className="block">Privacy</Link>
                <Link to="/refund" className="block">Refunds</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="smm-wrap mt-12 border-t pt-6 text-xs" style={{ borderColor: 'hsl(var(--smm-line))', color: 'hsl(var(--smm-copy))' }}>
          © {new Date().getFullYear()} MultySMM. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
