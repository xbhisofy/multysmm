import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Check, ChevronDown, Eye, Heart, LockKeyhole,
  Menu, MessageCircle, Play, Rocket, ShieldCheck, Sparkles, X, Zap,
} from 'lucide-react';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import skyImage from '@/assets/multysmm-sky.jpg';
import './catalis-home.css';

const features = [
  { icon: Eye, title: 'Real audience reach', text: 'Build visibility through creator-led clipping and genuine content discovery.' },
  { icon: Heart, title: 'Organic engagement', text: 'Grow through authentic likes, saves and shares—not bot-generated activity.' },
  { icon: MessageCircle, title: 'Human interactions', text: 'Create natural conversations with engagement designed to feel genuine.' },
  { icon: BarChart3, title: 'Growth analytics', text: 'Follow orders, delivery and performance from one calm, focused dashboard.' },
];

const plans = [
  { name: 'Starter', price: '$10', detail: 'For first campaigns', items: ['All major platforms', 'Live order tracking', 'AI delivery schedule', 'Wallet access'] },
  { name: 'Growth', price: '$50', detail: 'For active creators', items: ['Everything in Starter', 'Engagement bundles', 'Priority processing', 'Advanced analytics'] },
  { name: 'Scale', price: '$100', detail: 'For growing teams', items: ['Everything in Growth', 'API access', 'High-volume ordering', 'Priority support'] },
];

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="catalis-page" style={{ '--catalis-sky-image': `url(${skyImage})` } as React.CSSProperties}>
      <PageMeta
        title="MultySMM — Smarter Social Media Growth"
        description="Plan and manage safe, human-paced social media growth with MultySMM."
        canonicalPath="/"
        breadcrumbs={[{ name: 'Home', path: '/' }]}
      />

      <header className="catalis-shell catalis-sky relative min-h-[720px] overflow-hidden rounded-b-[1.7rem] md:min-h-[760px]">
        <nav className="catalis-nav absolute left-1/2 top-0 z-30 -translate-x-1/2 px-4 md:px-6">
          <div className="flex h-full min-h-[4.4rem] items-center justify-between gap-4">
            <Link to="/" aria-label="MultySMM home" className="flex items-center gap-2.5 shrink-0">
              <img src="/logo.png" alt="" className="h-9 w-9 rounded-full object-cover" />
              <span className="hidden text-sm font-bold sm:inline">MultySMM</span>
            </Link>
            <div className="hidden items-center gap-7 md:flex">
              <a href="#about" className="text-xs text-muted-foreground hover:text-foreground">About us</a>
              <a href="#features" className="text-xs text-muted-foreground hover:text-foreground">Features</a>
              <a href="#pricing" className="text-xs text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#footer" className="text-xs text-muted-foreground hover:text-foreground">Pages <ChevronDown className="ml-1 inline h-3 w-3" /></a>
            </div>
            <Button asChild className="catalis-button hidden sm:inline-flex">
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X /> : <Menu />}
            </Button>
          </div>
          {menuOpen && (
            <div className="grid gap-1 border-t py-3 md:hidden">
              {[['About us', '#about'], ['Features', '#features'], ['Pricing', '#pricing']].map(([label, href]) => (
                <a key={label} href={href} onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">{label}</a>
              ))}
              <Link to="/auth" className="rounded-md px-3 py-2 text-sm font-bold">Log in</Link>
            </div>
          )}
        </nav>

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 pb-52 pt-40 text-center md:pt-36">
          <span className="catalis-kicker mb-6 border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground">
            <Sparkles className="h-3 w-3" /> No bots. Real engagement.
          </span>
          <h1 className="catalis-display mb-6 text-primary-foreground">
            Grow through <em>organic</em> social engagement
          </h1>
          <p className="mb-8 max-w-xl text-sm leading-6 text-primary-foreground md:text-base">
            Get creator-led clipping and human-paced engagement designed for authentic growth—not automated bot activity.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="catalis-button"><Link to="/auth">Get Started</Link></Button>
            <Button asChild className="catalis-button catalis-button-light"><a href="#about">Learn More</a></Button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-[-4.5rem] z-20 mx-auto h-72 max-w-3xl">
          <div className="catalis-panel catalis-float absolute left-[4%] top-16 hidden w-64 p-5 shadow-xl sm:block">
            <div className="text-sm font-bold">Engagement</div>
            <div className="mt-2 font-serif text-4xl">85%</div>
            <div className="catalis-mini-chart mt-3 h-20 bg-muted">
              {[35, 60, 45, 74, 56, 92].map((height) => <span key={height} style={{ height: `${height}%` }} />)}
            </div>
          </div>
          <div className="catalis-panel absolute left-1/2 top-0 w-[min(88%,360px)] -translate-x-1/2 p-5 shadow-2xl">
            <div className="flex items-center justify-between"><strong>Growth score</strong><span className="rounded-full bg-muted px-3 py-1 text-[10px]">Monthly</span></div>
            <div className="catalis-mini-chart mt-5 h-40 bg-muted">
              {[32, 54, 46, 68, 82, 74, 96].map((height) => <span key={height} style={{ height: `${height}%` }} />)}
            </div>
            <div className="mt-4 flex items-center justify-between"><span className="text-xs text-muted-foreground">Campaign health</span><strong className="font-serif text-3xl">80%</strong></div>
          </div>
        </div>
      </header>

      <main>
        <section id="about" className="px-5 pb-20 pt-36 md:pb-28 md:pt-44">
          <div className="mx-auto max-w-5xl text-center">
            <span className="catalis-kicker mb-6"><Sparkles className="h-3 w-3 text-primary" /> About us</span>
            <h2 className="catalis-heading mx-auto max-w-5xl">
              We help creators and businesses grow through <em>real people, real content and organic engagement.</em>
            </h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-10 border-y py-10 md:grid-cols-3 md:gap-6">
            {[
              ['80%', 'Less time spent managing orders'],
              ['50K+', 'Successful orders delivered'],
              ['24/7', 'Monitoring and customer support'],
            ].map(([value, label]) => (
              <div key={value} className="flex items-center justify-center gap-5">
                <span className="font-serif text-6xl leading-none">{value}</span>
                <span className="max-w-32 text-sm leading-5 text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="catalis-shell catalis-sky rounded-[1.7rem] px-5 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-4xl text-center text-primary-foreground">
            <span className="catalis-kicker mb-6 border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground"><Sparkles className="h-3 w-3" /> Benefits</span>
            <h2 className="catalis-heading text-primary-foreground">Make social growth easy. Simplify <em>your journey.</em></h2>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-6">Adapt quickly, scale campaigns and keep every order clear from start to finish.</p>
          </div>
          <div className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="catalis-panel min-h-64 p-7 md:p-8">
                <div className="mb-10 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-primary"><Icon className="h-5 w-5" /></div>
                <h3 className="mb-3 text-2xl leading-tight">{title}</h3>
                <p className="text-sm leading-5 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center"><Button asChild className="catalis-button"><Link to="/auth">Get Started</Link></Button></div>
        </section>

        <section className="px-5 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <span className="catalis-kicker mb-6"><Sparkles className="h-3 w-3 text-primary" /> Features</span>
            <h2 className="catalis-heading">Empowering and <em>strengthening</em> your social success</h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-muted-foreground">Powerful tools for planning, ordering and tracking social engagement without the usual complexity.</p>
            <Button asChild className="catalis-button mt-7"><Link to="/auth">Start Growing</Link></Button>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-2">
            {[
              { tag: 'CLEAN INTERFACE', title: 'Intuitive order flow', icon: Play, text: 'Move from link to live campaign in a few clear steps.' },
              { tag: 'FASTER', title: 'Automated processes', icon: Zap, text: 'Smart schedules handle delivery while you focus on content.' },
              { tag: 'SECURE', title: 'Protected transactions', icon: LockKeyhole, text: 'Your account and wallet activity stay protected.' },
              { tag: 'TRUSTED TOOLS', title: 'Reliable monitoring', icon: ShieldCheck, text: 'See status, progress and results without chasing updates.' },
            ].map(({ tag, title, icon: Icon, text }) => (
              <article key={title} className="catalis-soft-panel flex min-h-80 flex-col p-7 md:p-9">
                <span className="mb-4 w-fit rounded-full bg-background px-3 py-1 text-[10px] font-bold text-primary">{tag}</span>
                <h3 className="text-3xl">{title}</h3>
                <div className="mt-auto flex items-end gap-5 pt-12">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-background text-primary"><Icon className="h-8 w-8" /></div>
                  <p className="text-sm leading-5 text-muted-foreground">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="catalis-sky px-5 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center text-primary-foreground">
            <span className="catalis-kicker mb-6 border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground"><Sparkles className="h-3 w-3" /> Wallet options</span>
            <h2 className="catalis-heading text-primary-foreground">Simple, transparent <em>growth</em></h2>
            <p className="mt-6 text-sm">Add funds when you need them. Your balance is used only for orders you place.</p>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className="catalis-panel flex min-h-[460px] flex-col p-7 md:p-8">
                <div className="mb-7 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-primary"><Sparkles className="h-5 w-5" /></span><h3 className="text-2xl">{plan.name}</h3></div>
                <div className="font-serif text-5xl">{plan.price}</div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.detail}</p>
                <div className="mt-8 space-y-4">
                  {plan.items.map((item) => <div key={item} className="flex gap-3 text-sm"><Check className="h-5 w-5 rounded-full bg-foreground p-1 text-background" />{item}</div>)}
                </div>
                <Button asChild className="catalis-button mt-auto"><Link to="/auth">Get Started <ArrowRight /></Link></Button>
              </article>
            ))}
          </div>
        </section>

        <section className="px-5 py-20 md:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <span className="catalis-kicker mb-6"><Sparkles className="h-3 w-3 text-primary" /> Built for you</span>
            <h2 className="catalis-heading">One platform for every <em>growth stage</em></h2>
            <p className="mx-auto mt-6 max-w-xl text-sm text-muted-foreground">A focused experience for independent creators, growing brands and busy agencies.</p>
          </div>
          <div className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
            {[
              ['“', 'Creators', 'Simple ordering and visible progress for every campaign.'],
              ['“', 'Brands', 'Structured engagement plans that keep launches moving.'],
              ['“', 'Agencies', 'High-volume tools for managing multiple client campaigns.'],
            ].map(([quote, name, text]) => (
              <article key={name} className="catalis-soft-panel min-h-72 p-8 text-left">
                <div className="font-serif text-6xl leading-none">{quote}</div>
                <p className="mt-5 text-sm leading-6 text-muted-foreground">{text}</p>
                <h3 className="mt-10 text-2xl">{name}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="catalis-shell catalis-sky relative min-h-[340px] overflow-hidden rounded-[1.7rem] px-5 py-20 text-center text-primary-foreground">
          <div className="relative z-10 mx-auto max-w-3xl">
            <Rocket className="mx-auto mb-5 h-8 w-8" />
            <h2 className="catalis-heading text-primary-foreground">Ready to grow with clarity?</h2>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-6">Create your account and launch your next social campaign from one simple place.</p>
            <Button asChild className="catalis-button mt-7"><Link to="/auth">Get Started</Link></Button>
          </div>
        </section>
      </main>

      <footer id="footer" className="px-5 py-16 md:py-20">
        <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Link to="/" className="flex items-center gap-3"><img src="/logo.png" alt="" className="h-10 w-10 rounded-full object-cover" /><strong className="font-serif text-2xl">MultySMM</strong></Link>
            <p className="mt-7 max-w-xs text-sm leading-6 text-muted-foreground">Smarter social growth, clear campaign control and support when you need it.</p>
            <Button asChild className="catalis-button mt-7"><Link to="/auth">Get Started</Link></Button>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div><h4 className="mb-5 font-bold">Product</h4><div className="space-y-3 text-sm text-muted-foreground"><a href="#features" className="block">Features</a><a href="#pricing" className="block">Pricing</a><Link to="/api-access" className="block">API access</Link></div></div>
            <div><h4 className="mb-5 font-bold">Company</h4><div className="space-y-3 text-sm text-muted-foreground"><Link to="/about" className="block">About us</Link><Link to="/contact" className="block">Contact</Link><Link to="/support" className="block">Support</Link></div></div>
            <div><h4 className="mb-5 font-bold">Legal</h4><div className="space-y-3 text-sm text-muted-foreground"><Link to="/terms" className="block">Terms</Link><Link to="/privacy" className="block">Privacy</Link><Link to="/refund" className="block">Refunds</Link></div></div>
          </div>
        </div>
        <div className="mx-auto mt-14 max-w-4xl border-t pt-6 text-xs text-muted-foreground">© {new Date().getFullYear()} MultySMM. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default Index;