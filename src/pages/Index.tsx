import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Menu, X } from 'lucide-react';
import { PageMeta } from '@/components/seo/PageMeta';
import './brutal-home.css';

const stats = [
  { value: '100%', label: 'Real human reach', tone: 'signal' },
  { value: '50K+', label: 'Orders delivered', tone: 'paper' },
  { value: '0.0%', label: 'Bot activity detected', tone: 'grey' },
];

const features = [
  {
    title: 'Human clipping',
    text: 'Real editors find the moments that travel — precision growth built on culture, not scripts.',
    mark: 'signal',
  },
  {
    title: 'Proof of work',
    text: 'Every order is tracked live: provider status, delivered counts and remaining quantity in one view.',
    mark: 'ink',
  },
  {
    title: 'Natural velocity',
    text: 'Human-paced delivery that triggers platform recommendations without tripping spam filters.',
    mark: 'outline',
  },
];

const tools = [
  ['01', 'Intuitive order flow', 'Link to live campaign in a few clear steps.'],
  ['02', 'Automated scheduling', 'Smart drip schedules run delivery while you create.'],
  ['03', 'Protected wallet', 'Funds, top-ups and refunds stay accounted for.'],
  ['04', 'Live monitoring', 'Status, progress and results without chasing updates.'],
];

const plans = [
  { name: 'Starter', price: '$10', detail: 'For first campaigns', items: ['All major platforms', 'Live order tracking', 'Auto delivery schedule', 'Wallet access'] },
  { name: 'Growth', price: '$50', detail: 'For active creators', items: ['Everything in Starter', 'Engagement bundles', 'Priority processing', 'Advanced analytics'], feature: true },
  { name: 'Scale', price: '$100', detail: 'For growing teams', items: ['Everything in Growth', 'API access', 'High-volume ordering', 'Priority support'] },
];

const marquee = ['Verified humans only', 'No bot activity', 'Organic expansion', 'Real engagement', 'Creator-led clipping', '24/7 monitoring'];

const navLinks = [
  ['About', '#about'],
  ['Features', '#features'],
  ['Pricing', '#pricing'],
  ['Support', '/support'],
];

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="brutal-page">
      <PageMeta
        title="MultySMM — Organic Social Growth, No Bots"
        description="Creator-led clipping and human-paced social engagement. Order, track and scale real growth from one dashboard."
        canonicalPath="/"
        breadcrumbs={[{ name: 'Home', path: '/' }]}
      />

      {/* NAV */}
      <nav className="brutal-nav">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="MultySMM home">
            <img src="/logo.png" alt="" className="h-9 w-9 border-2 border-foreground object-cover" />
            <span className="brutal-title text-lg">MultySMM</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map(([label, href]) =>
              href.startsWith('#') ? (
                <a key={label} href={href} className="text-sm font-bold uppercase tracking-wide hover:text-[hsl(var(--signal))]">{label}</a>
              ) : (
                <Link key={label} to={href} className="text-sm font-bold uppercase tracking-wide hover:text-[hsl(var(--signal))]">{label}</Link>
              ),
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="brutal-btn hidden px-6 py-3 text-sm sm:inline-flex">Launch</Link>
            <button
              type="button"
              className="border-2 border-foreground p-2 md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="grid border-t-2 border-foreground md:hidden">
            {navLinks.map(([label, href]) =>
              href.startsWith('#') ? (
                <a key={label} href={href} onClick={() => setMenuOpen(false)} className="border-b border-foreground/20 px-5 py-3 text-sm font-bold uppercase">{label}</a>
              ) : (
                <Link key={label} to={href} onClick={() => setMenuOpen(false)} className="border-b border-foreground/20 px-5 py-3 text-sm font-bold uppercase">{label}</Link>
              ),
            )}
            <Link to="/auth" onClick={() => setMenuOpen(false)} className="brutal-btn justify-center">Launch platform</Link>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="brutal-frame grid grid-cols-12 gap-0 overflow-hidden">
          {/* HERO */}
          <section className="brutal-cell col-span-12 flex flex-col justify-between border-b-2 border-foreground p-8 md:col-span-8 md:border-r-2 md:p-16">
            <div>
              <span className="brutal-tag mb-8">Human intelligence only</span>
              <h1 className="brutal-display mb-8 text-5xl md:text-7xl lg:text-8xl">
                MulTy <br />
                <span className="text-[hsl(var(--signal))]">SMM</span>
              </h1>
              <p className="max-w-md text-lg font-medium leading-snug md:text-2xl">
                Organic social engagement and clipping infrastructure powered by real people, not bot farms.
              </p>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-6">
              <Link to="/auth" className="brutal-btn text-base">Launch platform</Link>
              <a href="#features" className="brutal-link">See how it works</a>
            </div>
          </section>

          {/* STATS */}
          <div className="col-span-12 grid grid-rows-3 md:col-span-4">
            {stats.map(({ value, label, tone }, i) => (
              <div
                key={label}
                className={`${tone === 'signal' ? 'brutal-cell-signal items-center text-center' : tone === 'grey' ? 'brutal-cell-grey' : 'brutal-cell'} flex flex-col justify-center border-b-2 border-foreground p-8 ${i === 2 ? 'md:border-b-0' : ''}`}
              >
                <span className="brutal-title text-4xl md:text-5xl">{value}</span>
                <span className="mt-1 text-sm font-bold uppercase tracking-tight">{label}</span>
              </div>
            ))}
          </div>

          {/* FEATURES */}
          <section id="features" className="col-span-12 grid grid-cols-1 gap-[2px] bg-foreground md:grid-cols-3">
            {features.map(({ title, text, mark }) => (
              <article key={title} className="brutal-cell brutal-tile p-8 md:p-12">
                <div
                  className={`mb-6 flex h-12 w-12 items-center justify-center ${mark === 'signal' ? 'bg-[hsl(var(--signal))]' : mark === 'ink' ? 'bg-foreground' : 'border-2 border-[hsl(var(--signal))]'}`}
                >
                  {mark === 'signal' && <span className="h-6 w-6 border-2 border-background" />}
                  {mark === 'ink' && <span className="h-[2px] w-6 bg-background" />}
                  {mark === 'outline' && <span className="h-2 w-2 rounded-full bg-[hsl(var(--signal))]" />}
                </div>
                <h3 className="brutal-title mb-4 text-2xl">{title}</h3>
                <p className="text-base opacity-80">{text}</p>
              </article>
            ))}
          </section>

          {/* MARQUEE */}
          <div className="brutal-cell-ink col-span-12 overflow-hidden border-y-2 border-foreground py-5">
            <div className="brutal-marquee-track">
              {[...marquee, ...marquee].map((word, i) => (
                <span key={`${word}-${i}`} className="flex items-center gap-8">
                  <span className="brutal-title text-lg italic md:text-xl">{word}</span>
                  <span className="text-xl text-[hsl(var(--signal))]">●</span>
                </span>
              ))}
            </div>
          </div>

          {/* ABOUT + TOOLS */}
          <section id="about" className="brutal-cell-grey col-span-12 border-b-2 border-foreground p-8 md:col-span-5 md:border-b-0 md:border-r-2 md:p-12">
            <span className="brutal-tag mb-6">About us</span>
            <h2 className="brutal-title mb-6 text-3xl md:text-4xl">Real people. Real content. Real growth.</h2>
            <p className="text-base opacity-80">
              We help creators, brands and agencies grow through creator-led clipping and human-paced engagement — every
              order routed across verified providers with live status tracking.
            </p>
            <Link to="/auth" className="brutal-btn brutal-btn-ghost mt-8 text-sm">Create account <ArrowRight className="h-4 w-4" /></Link>
          </section>

          <section className="col-span-12 grid grid-cols-1 gap-[2px] bg-foreground md:col-span-7 md:grid-cols-2">
            {tools.map(([num, title, text]) => (
              <article key={title} className="brutal-cell brutal-tile p-8">
                <span className="brutal-title text-3xl text-[hsl(var(--signal))]">{num}</span>
                <h3 className="brutal-title mt-4 text-xl">{title}</h3>
                <p className="mt-3 text-sm opacity-80">{text}</p>
              </article>
            ))}
          </section>

          {/* PRICING */}
          <section id="pricing" className="col-span-12 border-t-2 border-foreground">
            <div className="brutal-cell flex flex-col gap-4 border-b-2 border-foreground p-8 md:flex-row md:items-end md:justify-between md:p-12">
              <div>
                <span className="brutal-tag mb-4">Wallet options</span>
                <h2 className="brutal-title text-3xl md:text-5xl">Simple, transparent pricing</h2>
              </div>
              <p className="max-w-sm text-base opacity-80">Top up when you need to. Your balance is only used for the orders you place.</p>
            </div>
            <div className="grid grid-cols-1 gap-[2px] bg-foreground md:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`${plan.feature ? 'brutal-cell-ink' : 'brutal-cell'} flex flex-col p-8 md:p-10`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="brutal-title text-2xl">{plan.name}</h3>
                    {plan.feature && <span className="brutal-tag">Popular</span>}
                  </div>
                  <div className="brutal-title mt-6 text-5xl">{plan.price}</div>
                  <p className="mt-2 text-sm opacity-70">{plan.detail}</p>
                  <ul className="mt-8 space-y-3">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--signal))]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/auth"
                    className={`brutal-btn mt-10 justify-center text-sm ${plan.feature ? 'bg-[hsl(var(--signal))]' : ''}`}
                  >
                    Get started <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="brutal-cell-signal col-span-12 flex flex-col items-start gap-6 border-t-2 border-foreground p-8 md:flex-row md:items-center md:justify-between md:p-14">
            <h2 className="brutal-title max-w-xl text-3xl md:text-5xl">Ready to grow without bots?</h2>
            <Link to="/auth" className="brutal-btn text-base">Start now <ArrowRight className="h-4 w-4" /></Link>
          </section>

          {/* FOOTER */}
          <footer id="footer" className="brutal-cell-ink col-span-12 border-t-2 border-foreground p-8 md:p-12">
            <div className="grid gap-10 md:grid-cols-[1.4fr_2fr]">
              <div>
                <Link to="/" className="flex items-center gap-3">
                  <img src="/logo.png" alt="" className="h-10 w-10 object-cover" />
                  <strong className="brutal-title text-xl">MultySMM</strong>
                </Link>
                <p className="mt-5 max-w-xs text-sm opacity-70">Creator-led clipping and organic engagement with full campaign control.</p>
              </div>
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                <div>
                  <h4 className="brutal-title mb-4 text-sm">Product</h4>
                  <div className="space-y-2 text-sm opacity-70">
                    <a href="#features" className="block">Features</a>
                    <a href="#pricing" className="block">Pricing</a>
                    <Link to="/api-access" className="block">API access</Link>
                  </div>
                </div>
                <div>
                  <h4 className="brutal-title mb-4 text-sm">Company</h4>
                  <div className="space-y-2 text-sm opacity-70">
                    <Link to="/about" className="block">About us</Link>
                    <Link to="/contact" className="block">Contact</Link>
                    <Link to="/support" className="block">Support</Link>
                  </div>
                </div>
                <div>
                  <h4 className="brutal-title mb-4 text-sm">Legal</h4>
                  <div className="space-y-2 text-sm opacity-70">
                    <Link to="/terms" className="block">Terms</Link>
                    <Link to="/privacy" className="block">Privacy</Link>
                    <Link to="/refund" className="block">Refunds</Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-10 border-t border-background/20 pt-5 text-xs opacity-60">
              © {new Date().getFullYear()} MultySMM. All rights reserved.
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Index;
