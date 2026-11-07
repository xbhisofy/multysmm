import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { ShoppingCart, Search, Globe, Instagram, Youtube, Music, Facebook, Send, Clock, Gauge, RefreshCw, Ban, ShieldCheck, Star, History, Loader2, CheckCircle2, Wallet, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ServicePicker } from '@/components/ServicePicker';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useSingleOrderServices } from '@/hooks/useSingleOrderServices';
import { supabase } from '@/integrations/supabase/client';
import { singleOrderPrice, singleOrderMarkedPrice, singleOrderValidation, servicePlatform, INR_PER_USD } from '../../supabase/functions/_shared/single-order-policy';

const formatINR = (n: number) => `₹${n.toFixed(2)}`;
import { toast } from 'sonner';

const platforms = [
  { key: 'all', label: 'All', icon: Globe },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'youtube', label: 'YouTube', icon: Youtube },
  { key: 'tiktok', label: 'TikTok', icon: Music },
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'telegram', label: 'Telegram', icon: Send },
  { key: 'twitter', label: 'Twitter / X', icon: Globe },
  { key: 'spotify', label: 'Spotify', icon: Music },
  { key: 'linkedin', label: 'LinkedIn', icon: Globe },
  { key: 'other', label: 'Other', icon: Globe },
];

export default function SingleOrder() {
  const { user, wallet, refreshWallet, isAdmin } = useAuth();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();
  const { data: services = [], isLoading, error: servicesError, refetch } = useSingleOrderServices();
  const [platform, setPlatform] = useState('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [formError, setFormError] = useState('');
  const [created, setCreated] = useState<{ number: number; duplicate: boolean } | null>(null);

  const filtered = useMemo(() => services.filter(service => {
    const matchesPlatform = platform === 'all' || servicePlatform(service.category, service.name) === platform;
    const text = `${service.service_number ?? ''} ${service.name} ${service.category}`.toLowerCase();
    return matchesPlatform && text.includes(search.trim().toLowerCase());
  }), [services, platform, search]);
  const categories = useMemo(() => [...new Set(filtered.map(service => service.category))], [filtered]);
  const activeCategory = categories.includes(category) ? category : categories[0] || '';
  const categoryServices = filtered.filter(service => service.category === activeCategory);
  const service = categoryServices.find(item => item.id === serviceId) || categoryServices[0];
  const qty = Number(quantity);
  const total = service && Number.isSafeInteger(qty) && qty > 0 ? singleOrderPrice(singleOrderMarkedPrice(service.price), qty) : 0;
  const insufficientBalance = Boolean(wallet && total / INR_PER_USD > Number(wallet.balance));

  useEffect(() => {
    setQuantity(service ? String(service.min_quantity) : '');
    setFormError('');
  }, [service?.id]);

  const placeOrder = useMutation({
    retry: false,
    mutationFn: async () => {
      if (!user || !service) throw new Error('Select an available service.');
      const validation = singleOrderValidation(link, qty, service.min_quantity, service.max_quantity);
      if (validation) throw new Error(validation);
      if (insufficientBalance) throw new Error('Insufficient balance. Add funds to continue.');
      const { data, error } = await supabase.functions.invoke('place-order', {
        body: { single_order: true, orderData: { service_id: service.id, link: link.trim(), quantity: qty, is_drip_feed: false, is_organic_mode: false }, totalPrice: total },
      });
      if (error) {
        const context = (error as { context?: Response }).context;
        const detail = context ? await context.json().catch(() => null) : null;
        throw new Error(detail?.error || error.message);
      }
      if (data?.error || !data?.success) throw new Error(data?.error || 'Order could not be placed.');
      return data;
    },
    onSuccess: async (data) => {
      setCreated({ number: data.order_number, duplicate: Boolean(data.duplicate_blocked) });
      setFormError('');
      if (!data.duplicate_blocked) setLink('');
      await Promise.all([refreshWallet(), queryClient.invalidateQueries({ queryKey: ['orders', user?.id] }), queryClient.invalidateQueries({ queryKey: ['transactions'] })]);
      toast.success(data.duplicate_blocked ? `Existing order #${data.order_number} found — not charged again.` : `Order #${data.order_number} placed.`);
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const facts = service ? [
    { label: 'Start time', value: service.start_time || '—', icon: Clock },
    { label: 'Speed', value: service.speed || '—', icon: Gauge },
    { label: 'Refill', value: service.refill || '—', icon: RefreshCw },
    { label: 'Cancel', value: service.cancel_allowed || '—', icon: Ban },
    { label: 'Drop', value: service.drop_type || '—', icon: ShieldCheck },
    { label: 'Quality', value: service.quality || '—', icon: Star },
  ] : [];

  const card = "single-workspace space-y-6";
  const field = "single-field h-14 rounded-2xl border-border bg-secondary/50 text-base";
  const step = (n: number, t: string) => <h2 className="flex items-center gap-3 text-sm font-extrabold uppercase tracking-wide text-muted-foreground"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">{n}</span>{t}</h2>;

  return (
    <DashboardLayout>
      <div className="single-order-page mx-auto max-w-3xl space-y-5 pb-6">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Our Social media Services</h1>

        <div className={card}>
          <nav aria-label="Order type" className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-secondary/50 p-2">
            <Link to="/single-order" aria-current="page" className="flex flex-col items-center gap-1 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-primary-foreground shadow-md"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-foreground/20"><ShoppingCart className="h-4 w-4" /></span>New Order</Link>
            <Link to="/orders" className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-3 py-3 text-xs font-bold text-muted-foreground"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary"><History className="h-4 w-4" /></span>Order History</Link>
          </nav>

          <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-secondary/50 p-2" aria-label="Service platform">
            {platforms.filter(item => item.key === 'all' || services.some(s => servicePlatform(s.category, s.name) === item.key)).map(({ key, label, icon: Icon }) => {
              const on = platform === key;
              return <Button variant="ghost" type="button" key={key} aria-pressed={on} onClick={() => { setPlatform(key); setCategory(''); setServiceId(''); }} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-base font-semibold shadow-sm transition-colors ${on ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'}`}><span className={`flex h-8 w-8 items-center justify-center rounded-full ${on ? 'bg-primary-foreground/25' : 'bg-secondary text-primary'}`}><Icon className="h-4 w-4" /></span>{label}</Button>;
            })}
          </div>

          {created && <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary p-4"><CheckCircle2 className="h-5 w-5 text-primary" /><span className="flex-1 font-bold">{created.duplicate ? 'Existing order' : 'Order placed'} #{created.number}</span><Button variant="link" asChild><Link to="/orders">View order</Link></Button></div>}

          <h2 className="text-xl font-extrabold">Enter your details</h2>
          <form onSubmit={event => { event.preventDefault(); setCreated(null); placeOrder.mutate(); }} className="space-y-5">
            <section className="space-y-4 single-step space-y-4 p-4 sm:p-6">
              {step(1, 'Search or pick a service')}
              <div className="relative"><Search className="absolute left-4 top-4 h-5 w-5 text-foreground" /><Input aria-label="Search service" placeholder="Search service..." value={search} onChange={e => setSearch(e.target.value)} className={field + " pl-12"} disabled={placeOrder.isPending} /></div>
              {isLoading ? <div className="flex items-center gap-2 py-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading services…</div> : servicesError ? <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">Could not load services.<Button type="button" variant="outline" onClick={() => refetch()}><RefreshCw />Retry</Button></div> : categories.length === 0 ? <div className="space-y-3 py-4"><p className="text-muted-foreground">{search ? 'No matching services.' : 'No single-order services available yet.'}</p>{isAdmin && <Button variant="outline" asChild><Link to="/admin/services">Import Services</Link></Button>}</div> : <>
                <div className="space-y-2"><Label htmlFor="single-category" className="text-base font-bold">Category</Label><ServicePicker id="single-category" value={activeCategory} disabled={placeOrder.isPending} onChange={value => { setCategory(value); setServiceId(''); }} placeholder="Choose category" options={categories.map(item => ({ value: item, label: item }))} /></div>
                <div className="space-y-2"><Label htmlFor="single-service" className="text-base font-bold">Service</Label><ServicePicker id="single-service" value={service?.id || ''} disabled={placeOrder.isPending} onChange={setServiceId} placeholder="Choose service" options={categoryServices.map(item => ({ value: item.id, number: item.service_number, label: `${item.name} — ${formatINR(singleOrderMarkedPrice(item.price))} per 1000` }))} /></div>
              </>}
            </section>

            {service && <section className="space-y-5 single-step space-y-4 p-4 sm:p-6">
              {step(2, 'Configure your order')}
              <p className="text-base font-bold">Description</p>
              <div className="single-facts grid grid-cols-2 gap-2 p-3 sm:gap-3">{facts.map(({ label, value, icon: Icon }) => <div key={label} className="single-fact flex min-w-0 items-center gap-2 p-3 sm:gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-xs uppercase text-muted-foreground">{label === 'Start time' ? 'Avg. time' : label}</p><p className="break-words text-sm font-bold">{value}</p></div></div>)}</div>
              <div className="single-description p-4 sm:p-5"><p className="mb-3 flex items-center justify-center gap-2 text-sm font-bold text-primary"><AlertCircle className="h-4 w-4" />Read before you order :</p><p className="mb-2 text-lg font-bold">Service ID: {service.service_number ?? '—'}</p>{service.description ? <div className="prose prose-sm max-w-none break-words text-foreground [&_*]:text-foreground"><ReactMarkdown skipHtml>{service.description}</ReactMarkdown></div> : <p className="text-sm font-medium">{service.name}</p>}</div>
              <div className="space-y-2"><Label htmlFor="single-link" className="text-base font-bold">Link</Label><Input id="single-link" value={link} onChange={e => { setLink(e.target.value); setFormError(''); }} placeholder="https://..." className={field} disabled={placeOrder.isPending} /></div>
              <div className="space-y-2"><Label htmlFor="single-quantity" className="text-base font-bold">Quantity</Label><Input id="single-quantity" type="number" inputMode="numeric" min={service.min_quantity} max={service.max_quantity} step={1} value={quantity} onChange={e => { setQuantity(e.target.value); setFormError(''); }} className={field} disabled={placeOrder.isPending} /><p className="inline-block rounded-xl border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">Min: {service.min_quantity} - Max: {service.max_quantity}</p></div>
            </section>}

            {(formError || insufficientBalance) && <div role="alert" className="flex items-start gap-2 px-2 text-sm font-semibold text-destructive"><AlertCircle className="h-5 w-5 shrink-0" /><span>{formError || 'Insufficient balance.'} {insufficientBalance && <Link to="/wallet" className="underline">Add funds</Link>}</span></div>}
            <div className="single-total space-y-4 p-5 text-primary-foreground">
              <div><p className="text-sm font-semibold opacity-90">Total Amount</p><p className="text-3xl font-extrabold">{formatINR(total)}</p><p className="mt-1 flex items-center gap-1 text-xs opacity-90"><Wallet className="h-3 w-3" />Balance: {formatPrice(Number(wallet?.balance || 0))}</p></div>
              <Button variant="secondary" type="submit" disabled={!service || !wallet || placeOrder.isPending || insufficientBalance} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-card text-lg font-bold text-primary disabled:opacity-60">{placeOrder.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}{placeOrder.isPending ? 'Placing Order…' : 'Place Order'}</Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
