import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Copy, Megaphone, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { ENGAGEMENT_CONFIG, MANUAL_PLATFORMS, PLATFORM_CONFIG } from '@/lib/engagement-types';

type Row = {
  id: string; order_number: number; user_id: string; link: string; total_price: number;
  status: string; created_at: string; bundle_id: string | null;
  config_snapshot: { engagements?: Record<string, { time_limit_hours?: number; run_count?: number | null; run_interval_minutes?: number | null }> } | null;
  engagement_order_items: { id: string; engagement_type: string; quantity: number; price: number }[];
};

const FILTERS = ['pending', 'processing', 'completed', 'failed', 'all'] as const;

export default function AdminManualOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-manual-orders', filter],
    queryFn: async () => {
      const { data: bundles, error: bundleError } = await supabase.from('engagement_bundles').select('id, name, platform').in('platform', [...MANUAL_PLATFORMS]);
      if (bundleError) throw bundleError;
      const bundleNames: Record<string, string> = {};
      (bundles || []).forEach((b) => { bundleNames[b.id] = `${PLATFORM_CONFIG[b.platform as keyof typeof PLATFORM_CONFIG]?.label || b.platform} · ${b.name}`; });
      const ids = (bundles || []).map((b) => b.id);
      if (!ids.length) return { rows: [] as Row[], emails: {} as Record<string, string>, bundleNames };
      let q = supabase.from('engagement_orders')
        .select('id, order_number, user_id, link, total_price, status, created_at, bundle_id, config_snapshot, engagement_order_items(id, engagement_type, quantity, price)')
        .in('bundle_id', ids).order('created_at', { ascending: false }).limit(200);
      if (filter !== 'all') q = q.eq('status', filter);
      const { data: rows, error } = await q;
      if (error) throw error;
      const userIds = [...new Set((rows || []).map((r) => r.user_id))];
      const emails: Record<string, string> = {};
      if (userIds.length) {
        const { data: profs, error: profileError } = await supabase.from('profiles').select('user_id, email').in('user_id', userIds);
        if (profileError) throw profileError;
        (profs || []).forEach((p) => { emails[p.user_id] = p.email; });
      }
      return { rows: (rows || []) as unknown as Row[], emails, bundleNames };
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const itemStatus = status === 'processing' ? 'processing' : status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'pending';
      const { error } = await supabase.from('engagement_orders').update({ status }).eq('id', id);
      if (error) throw error;
      const { error: e2 } = await supabase.from('engagement_order_items').update({ status: itemStatus }).eq('engagement_order_id', id);
      if (e2) throw e2;
    },
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['admin-manual-orders'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy. Please select and copy the link manually.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Ads Orders</h1>
            <p className="text-sm text-muted-foreground">{data?.rows.length ?? 0} orders · Latest 200</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
        </div>

        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {error && <div role="alert" className="text-destructive flex flex-wrap items-center gap-3"><p>Could not load orders: {error.message}</p><Button variant="outline" onClick={() => refetch()}>Retry</Button></div>}
        {!isLoading && !error && !data?.rows.length && (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No orders here.</CardContent></Card>
        )}

        <div className="grid gap-3">
          {data?.rows.map((o) => {
            const network = o.bundle_id ? data.bundleNames[o.bundle_id] || 'Ads network' : 'Ads network';
            const timing = (type: string) => {
              const config = o.config_snapshot?.engagements?.[type];
              return [
                config?.time_limit_hours && config.time_limit_hours > 0 ? `${config.time_limit_hours} hours` : 'Auto delivery',
                config?.run_count ? `${config.run_count} runs` : null,
                config?.run_interval_minutes ? `Every ${config.run_interval_minutes} min` : null,
              ].filter(Boolean).join(' · ');
            };
            const details = [
              `Order #${o.order_number}`,
              `Network / Package: ${network}`,
              `Customer: ${data.emails[o.user_id] || o.user_id}`,
              `Date: ${format(new Date(o.created_at), 'yyyy-MM-dd HH:mm xxx')}`,
              `Status: ${o.status}`,
              `Link: ${o.link}`,
              ...o.engagement_order_items.map((i) => `${ENGAGEMENT_CONFIG[i.engagement_type as keyof typeof ENGAGEMENT_CONFIG]?.label || i.engagement_type}: ${i.quantity} | $${Number(i.price).toFixed(2)} | ${timing(i.engagement_type)}`),
              `Total: $${Number(o.total_price).toFixed(2)} USD`,
            ].join('\n');
            return (
              <Card key={o.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold">#{o.order_number}</span>
                      <Badge variant="secondary" className="capitalize">{o.status}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(o.created_at), 'MMM d, yyyy · HH:mm xxx')}</span>
                    </div>
                    <span className="text-sm font-bold">${Number(o.total_price).toFixed(2)}</span>
                  </div>
                  <p className="font-bold text-primary break-words">{network}</p>
                  <p className="text-sm text-muted-foreground break-all">Customer: {data.emails[o.user_id] || o.user_id}</p>
                  <div className="space-y-2 border-y border-border py-3">
                    <p className="text-xs font-semibold text-muted-foreground">Target link</p>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <a href={o.link} target="_blank" rel="noopener noreferrer" className="text-primary font-medium text-sm min-w-0 flex-1 break-all select-text">{o.link}</a>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => copy(o.link, 'Link')}><Copy className="h-3.5 w-3.5 mr-1" />Copy link</Button>
                        <Button size="icon" variant="outline" asChild><a href={o.link} target="_blank" rel="noopener noreferrer" aria-label={`Open link for order ${o.order_number}`}><ExternalLink className="h-4 w-4" /></a></Button>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {o.engagement_order_items.map((i) => (
                      <div key={i.id} className="py-2 flex flex-wrap justify-between items-start gap-2 text-sm">
                        <div><p className="font-semibold">{ENGAGEMENT_CONFIG[i.engagement_type as keyof typeof ENGAGEMENT_CONFIG]?.label || i.engagement_type}: {i.quantity.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">{timing(i.engagement_type)}</p></div>
                        <span className="font-semibold">${Number(i.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => copy(details, 'Order details')}><Copy className="h-3.5 w-3.5 mr-1" />Copy all details</Button>
                    {o.status !== 'processing' && <Button size="sm" variant="secondary" onClick={() => setStatus.mutate({ id: o.id, status: 'processing' })}>Mark Processing</Button>}
                    {o.status !== 'completed' && <Button size="sm" onClick={() => setStatus.mutate({ id: o.id, status: 'completed' })}>Mark Completed</Button>}
                    {o.status !== 'failed' && <Button size="sm" variant="destructive" onClick={() => setStatus.mutate({ id: o.id, status: 'failed' })}>Mark Failed</Button>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
