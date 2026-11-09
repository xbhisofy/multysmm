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
import { PlatformIcon } from '@/components/PlatformIcon';
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

  const tones = ['bg-sky-100 text-sky-600','bg-amber-100 text-amber-500','bg-emerald-100 text-emerald-600','bg-blue-100 text-blue-600','bg-violet-100 text-violet-500','bg-orange-100 text-orange-500'];
  const field = "single-field h-14 rounded-full border border-primary/15 bg-primary/5 px-5 text-[15px] shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/25";
  const head = (t: string, dot = 'bg-primary') => <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-primary"><span className={`h-2.5 w-2.5 rounded-full ${dot}`} />{t}</h2>;

  return (
    <DashboardLayout>
      <div className="single-order-page mx-auto max-w-2xl space-y-5 pb-6">
        {created && <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary p-3"><CheckCircle2 className="h-5 w-5 text-primary" /><span className="flex-1 text-sm font-bold">{created.duplicate ? 'Existing order' : 'Order placed'} #{created.number}</span><Button variant="link" asChild><Link to="/orders">View order</Link></Button></div>}
        <form onSubmit={event => { event.preventDefault(); setCreated(null); placeOrder.mutate(); }} className="space-y-5">
          <div className="relative"><Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search service" placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} className={field + " pl-12"} disabled={placeOrder.isPending} /></div>
          {isLoading ? <div className="flex items-center gap-2 py-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading services…</div> : servicesError ? <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">Could not load services.<Button type="button" variant="outline" onClick={() => refetch()}><RefreshCw />Retry</Button></div> : categories.length === 0 ? <div className="space-y-3 py-4"><p className="text-muted-foreground">{search ? 'No matching services.' : 'No single-order services available yet.'}</p>{isAdmin && <Button variant="outline" asChild><Link to="/admin/services">Import Services</Link></Button>}</div> : <>
            <div className="space-y-2.5">{head('Category')}<ServicePicker id="single-category" value={activeCategory} disabled={placeOrder.isPending} onChange={value => { setCategory(value); setServiceId(''); }} placeholder="Choose category" options={categories.map(item => ({ value: item, label: item, platform: servicePlatform(item, filtered.find(service => service.category === item)?.name || '') }))} /></div>
            <div className="space-y-2.5">{head('Service')}<ServicePicker id="single-service" value={service?.id || ''} disabled={placeOrder.isPending} onChange={setServiceId} placeholder="Choose service" options={categoryServices.map(item => ({ value: item.id, number: item.service_number, platform: servicePlatform(item.category, item.name), label: `${item.name} - ${formatINR(singleOrderMarkedPrice(item.price))}/1K` }))} /></div>
          </>}

          {service && <>
            <div className="space-y-2.5">{head('Description')}
              <div className="rounded-3xl border border-primary/10 bg-primary/5 p-4 sm:p-5">
                <div className="grid grid-cols-3 gap-x-2 gap-y-6">{facts.map(({ label, value, icon: Icon }, i) => <div key={label} className="flex min-w-0 flex-col items-center text-center"><span className={`mb-2 flex h-11 w-11 items-center justify-center rounded-full ${tones[i]}`}><Icon className="h-5 w-5" /></span><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="break-words text-sm font-extrabold uppercase">{value}</p></div>)}</div>
                <div className="mt-5 border-t border-primary/10 pt-4"><p className="mb-2 flex items-center gap-2 text-sm font-extrabold"><AlertCircle className="h-4 w-4 text-amber-500" />Read before you order:</p>{service.description ? <div className="prose prose-sm max-w-none break-words text-muted-foreground [&_*]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:marker:text-amber-500"><ReactMarkdown skipHtml>{service.description}</ReactMarkdown></div> : <p className="text-sm text-muted-foreground">{service.name}</p>}</div>
              </div>
            </div>
            <div className="space-y-2.5">{head('Link', 'bg-amber-400')}<div className="relative"><Globe className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input id="single-link" aria-label="Link" value={link} onChange={e => { setLink(e.target.value); setFormError(''); }} placeholder="Paste your link here (Account must be public)" className={field + " pl-12"} disabled={placeOrder.isPending} /></div></div>
            <div className="space-y-2.5">{head('Quantity', 'bg-amber-400')}<Input id="single-quantity" aria-label="Quantity" type="number" inputMode="numeric" min={service.min_quantity} max={service.max_quantity} step={1} value={quantity} onChange={e => { setQuantity(e.target.value); setFormError(''); }} placeholder={`Min: ${service.min_quantity} - Max: ${service.max_quantity}`} className={field} disabled={placeOrder.isPending} /><p className="px-1 text-xs text-muted-foreground">Min: {service.min_quantity} - Max: {service.max_quantity.toLocaleString()}</p></div>
          </>}

          {(formError || insufficientBalance) && <div role="alert" className="flex items-start gap-2 px-2 text-sm font-semibold text-destructive"><AlertCircle className="h-5 w-5 shrink-0" /><span>{formError || 'Insufficient balance.'} {insufficientBalance && <Link to="/wallet" className="underline">Add funds</Link>}</span></div>}
          <div className="single-total flex items-center justify-between gap-3 rounded-3xl bg-primary p-4 pl-6 text-primary-foreground shadow-lg">
            <div><p className="text-[11px] font-semibold uppercase tracking-wide opacity-90">Total</p><p className="text-2xl font-extrabold">{formatINR(total)}</p><p className="flex items-center gap-1 text-[11px] opacity-90"><Wallet className="h-3 w-3" />{formatPrice(Number(wallet?.balance || 0))}</p></div>
            <Button variant="secondary" type="submit" disabled={!service || !wallet || placeOrder.isPending || insufficientBalance} className="h-12 rounded-full bg-primary-foreground/15 px-6 text-sm font-extrabold uppercase text-primary-foreground hover:bg-primary-foreground/25 disabled:opacity-60">{placeOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}{placeOrder.isPending ? 'Placing…' : 'Order Now'}</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
