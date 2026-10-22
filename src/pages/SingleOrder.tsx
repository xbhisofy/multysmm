import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { ShoppingCart, Search, Globe, Instagram, Youtube, Music, Facebook, Send, Clock, Gauge, RefreshCw, Ban, ShieldCheck, Star, History, Loader2, CheckCircle2, Wallet, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useSingleOrderServices } from '@/hooks/useSingleOrderServices';
import { supabase } from '@/integrations/supabase/client';
import { singleOrderPrice, singleOrderValidation, servicePlatform } from '../../supabase/functions/_shared/single-order-policy';
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
    const text = `${service.provider_service_id} ${service.name} ${service.category}`.toLowerCase();
    return matchesPlatform && text.includes(search.trim().toLowerCase());
  }), [services, platform, search]);
  const categories = useMemo(() => [...new Set(filtered.map(service => service.category))], [filtered]);
  const activeCategory = categories.includes(category) ? category : categories[0] || '';
  const categoryServices = filtered.filter(service => service.category === activeCategory);
  const service = categoryServices.find(item => item.id === serviceId) || categoryServices[0];
  const qty = Number(quantity);
  const total = service && Number.isSafeInteger(qty) && qty > 0 ? singleOrderPrice(service.price, qty) : 0;
  const insufficientBalance = Boolean(wallet && total > Number(wallet.balance));

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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl">Single Order</h1>
          </div>
          <Button variant="outline" asChild className="rounded-lg"><Link to="/orders"><History />Order History</Link></Button>
        </header>

        <nav aria-label="Order type" className="flex gap-2 border-b border-border pb-4">
          <Button className="rounded-lg" aria-current="page"><ShoppingCart />Single Order</Button>
          <Button variant="outline" className="rounded-lg" asChild><Link to="/engagement-order">Full Engagement</Link></Button>
        </nav>

        <div className="flex flex-wrap gap-2" aria-label="Service platform">
          {platforms.filter(item => item.key === 'all' || services.some(s => servicePlatform(s.category, s.name) === item.key)).map(({ key, label, icon: Icon }) => (
            <Button key={key} size="sm" variant={platform === key ? 'default' : 'outline'} aria-pressed={platform === key} className="rounded-lg" onClick={() => { setPlatform(key); setCategory(''); setServiceId(''); }}><Icon />{label}</Button>
          ))}
        </div>

        {created && <div role="status" className="flex flex-wrap items-center gap-3 border-l-4 border-primary bg-secondary p-4"><CheckCircle2 className="h-5 w-5 text-primary" /><span className="flex-1 font-bold">{created.duplicate ? 'Existing order' : 'Order placed'} #{created.number}</span><Button variant="link" asChild><Link to="/orders">View order <History /></Link></Button></div>}

        <form onSubmit={event => { event.preventDefault(); setCreated(null); placeOrder.mutate(); }} className="space-y-6">
          <section className="space-y-4 border-y border-border bg-secondary/40 px-4 py-6 sm:px-6">
            <h2 className="flex items-center gap-3 text-sm uppercase"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">1</span>Search or pick a service</h2>
            <div className="relative"><Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" /><Input aria-label="Search service" placeholder="Search by ID, name or category..." value={search} onChange={e => setSearch(e.target.value)} className="h-14 rounded-lg pl-12" disabled={placeOrder.isPending} /></div>
            {isLoading ? <div className="flex items-center gap-2 py-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading services…</div> : servicesError ? <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">Could not load services.<Button type="button" variant="outline" onClick={() => refetch()}><RefreshCw />Retry</Button></div> : categories.length === 0 ? <div className="space-y-3 py-4"><p className="text-muted-foreground">{search ? 'No matching services.' : 'No single-order services available yet.'}</p>{isAdmin && <Button variant="outline" asChild><Link to="/admin/services">Import Services</Link></Button>}</div> : <>
              <div className="space-y-2"><Label htmlFor="single-category">Category</Label><Select value={activeCategory} disabled={placeOrder.isPending} onValueChange={value => { setCategory(value); setServiceId(''); }}><SelectTrigger id="single-category" className="h-auto min-h-14 rounded-lg text-left [&>span]:whitespace-normal"><SelectValue placeholder="Choose category" /></SelectTrigger><SelectContent>{categories.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="single-service">Service</Label><Select value={service?.id || ''} disabled={placeOrder.isPending} onValueChange={setServiceId}><SelectTrigger id="single-service" className="h-auto min-h-14 rounded-lg py-3 text-left [&>span]:whitespace-normal"><SelectValue placeholder="Choose service" /></SelectTrigger><SelectContent className="max-w-[calc(100vw-2rem)]">{categoryServices.map(item => <SelectItem key={item.id} value={item.id} className="py-3"><span className="break-words">{item.provider_service_id} · {item.name} — {formatPrice(item.price)} / 1,000</span></SelectItem>)}</SelectContent></Select></div>
            </>}
          </section>

          {service && <section className="space-y-5 px-4 sm:px-6">
            <h2 className="flex items-center gap-3 text-sm uppercase"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">2</span>Configure your order</h2>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 border-y border-border py-5 sm:grid-cols-3">{facts.map(({ label, value, icon: Icon }) => <div key={label} className="flex min-w-0 items-center gap-3"><Icon className="h-5 w-5 shrink-0 text-primary" /><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="break-words text-sm font-bold">{value}</p></div></div>)}</div>
            <div className="border-l-4 border-primary bg-secondary p-4"><p className="mb-2 text-sm font-bold text-primary">Service ID: {service.provider_service_id}</p>{service.description ? <div className="prose prose-sm max-w-none break-words text-foreground [&_*]:text-foreground"><ReactMarkdown skipHtml>{service.description}</ReactMarkdown></div> : <p className="text-sm font-medium">{service.name}</p>}</div>
            <div className="space-y-2"><Label htmlFor="single-link">Link</Label><Input id="single-link" value={link} onChange={e => { setLink(e.target.value); setFormError(''); }} placeholder="https://..." className="h-14 rounded-lg" disabled={placeOrder.isPending} /></div>
            <div className="space-y-2"><Label htmlFor="single-quantity">Quantity</Label><Input id="single-quantity" type="number" inputMode="numeric" min={service.min_quantity} max={service.max_quantity} step={1} value={quantity} onChange={e => { setQuantity(e.target.value); setFormError(''); }} className="h-14 rounded-lg" disabled={placeOrder.isPending} /><p className="text-xs font-semibold text-muted-foreground">Min: {service.min_quantity.toLocaleString()} · Max: {service.max_quantity.toLocaleString()}</p></div>
          </section>}

          {(formError || insufficientBalance) && <div role="alert" className="flex items-start gap-2 px-4 text-sm font-semibold text-destructive"><AlertCircle className="h-5 w-5 shrink-0" /><span>{formError || 'Insufficient balance.'} {insufficientBalance && <Link to="/wallet" className="underline">Add funds</Link>}</span></div>}
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-secondary px-4 py-5 sm:px-6">
            <div><p className="text-xs font-semibold text-muted-foreground">Total Amount</p><p className="text-2xl font-extrabold text-primary">{formatPrice(total)}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Wallet className="h-3 w-3" />Balance: {formatPrice(Number(wallet?.balance || 0))}</p></div>
            <Button type="submit" className="h-12 rounded-lg px-6" disabled={!service || !wallet || placeOrder.isPending || insufficientBalance}>{placeOrder.isPending ? <Loader2 className="animate-spin" /> : <ShoppingCart />}{placeOrder.isPending ? 'Placing Order…' : 'Place Order'}</Button>
          </footer>
        </form>
      </div>
    </DashboardLayout>
  );
}