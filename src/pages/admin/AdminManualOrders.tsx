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
import { ENGAGEMENT_CONFIG, MANUAL_PLATFORMS } from '@/lib/engagement-types';

type Row = {
  id: string; order_number: number; user_id: string; link: string; total_price: number;
  status: string; created_at: string;
  engagement_order_items: { id: string; engagement_type: string; quantity: number; price: number }[];
};

const FILTERS = ['pending', 'processing', 'completed', 'failed', 'all'] as const;

export default function AdminManualOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('pending');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-manual-orders', filter],
    queryFn: async () => {
      const { data: bundles } = await supabase.from('engagement_bundles').select('id').in('platform', [...MANUAL_PLATFORMS]);
      const ids = (bundles || []).map((b) => b.id);
      if (!ids.length) return { rows: [] as Row[], emails: {} as Record<string, string> };
      let q = supabase.from('engagement_orders')
        .select('id, order_number, user_id, link, total_price, status, created_at, engagement_order_items(id, engagement_type, quantity, price)')
        .in('bundle_id', ids).order('created_at', { ascending: false }).limit(200);
      if (filter !== 'all') q = q.eq('status', filter);
      const { data: rows, error } = await q;
      if (error) throw error;
      const userIds = [...new Set((rows || []).map((r) => r.user_id))];
      const emails: Record<string, string> = {};
      if (userIds.length) {
        const { data: profs } = await supabase.from('profiles').select('user_id, email').in('user_id', userIds);
        (profs || []).forEach((p) => { emails[p.user_id] = p.email; });
      }
      return { rows: (rows || []) as Row[], emails };
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

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success('Copied'); };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Adsterra Orders</h1>
            <p className="text-sm text-muted-foreground">Manual orders — copy the details, place them in your software, then update the status.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
        </div>

        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {!isLoading && !data?.rows.length && (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No orders here.</CardContent></Card>
        )}

        <div className="grid gap-3">
          {data?.rows.map((o) => {
            const details = [
              `Order #${o.order_number}`,
              `Link: ${o.link}`,
              ...o.engagement_order_items.map((i) => `${ENGAGEMENT_CONFIG[i.engagement_type as keyof typeof ENGAGEMENT_CONFIG]?.label || i.engagement_type}: ${i.quantity}`),
            ].join('\n');
            return (
              <Card key={o.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold">#{o.order_number}</span>
                      <Badge variant="secondary" className="capitalize">{o.status}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(o.created_at), 'MMM d, HH:mm')}</span>
                    </div>
                    <span className="text-sm font-bold">${Number(o.total_price).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{data.emails[o.user_id] || o.user_id}</p>
                  <div className="flex items-center gap-2 text-sm break-all">
                    <a href={o.link} target="_blank" rel="noreferrer" className="text-primary font-medium flex items-center gap-1">
                      {o.link} <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {o.engagement_order_items.map((i) => (
                      <Badge key={i.id} variant="outline" className="text-sm py-1">
                        {ENGAGEMENT_CONFIG[i.engagement_type as keyof typeof ENGAGEMENT_CONFIG]?.label || i.engagement_type}: <b className="ml-1">{i.quantity.toLocaleString()}</b>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => copy(details)}><Copy className="h-3.5 w-3.5 mr-1" />Copy details</Button>
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
