import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, ArrowLeft, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Provider { provider_id: string; provider_name: string; pending_runs: number; cost_inr: number; balance_inr: number; unknown_runs: number; balance_unknown?: boolean }
interface Breakdown { provider_id: string; service_id: string; service_name: string; pending_quantity: number; pending_runs: number }
interface PendingUser { user_id: string; email: string; full_name: string; pending_orders: number; pending_value_inr: number; wallet_inr: number; spent_inr: number }
interface Report { generated_at: string; providers: Provider[]; breakdown: Breakdown[]; top_users: PendingUser[] }
const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

export default function AdminTopupPlan() {
  const navigate = useNavigate();
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ['verified-provider-topup-report'],
    queryFn: async () => {
      const response = await supabase.functions.invoke('provider-topup-report', { body: {} });
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      return response.data as Report;
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
  const providers = data?.providers ?? [];
  const totalRuns = providers.reduce((s,p) => s + p.pending_runs, 0);
  const cost = providers.reduce((s,p) => s + p.cost_inr, 0);
  const balance = providers.reduce((s,p) => s + p.balance_inr, 0);
  const unknown = providers.reduce((s,p) => s + p.unknown_runs, 0);
  const incomplete = unknown > 0 || providers.some(p => p.balance_unknown);
  // Provider balances cannot be transferred across providers: sum deficits, not net balances.
  const topup = providers.reduce((s,p) => s + Math.max(0, p.cost_inr - p.balance_inr), 0);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(providers.filter(p => p.cost_inr > p.balance_inr).map(p => `${p.provider_name}: ${inr(p.cost_inr - p.balance_inr)}`).join('\n') + `\nTotal: ${inr(topup)}`);
      toast.success('Plan copied');
    } catch { toast.error('Unable to copy plan'); }
  };
  return <DashboardLayout><div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><Button variant="ghost" size="sm" onClick={() => navigate('/admin')}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button><h1 className="text-2xl font-bold">Provider Top-up Plan</h1></div>
      <div className="flex gap-2"><Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />Refresh</Button><Button size="sm" onClick={copy} disabled={!data || incomplete || isFetching || topup <= 0}><Copy className="mr-2 h-4 w-4" />Copy Plan</Button></div>
    </header>
    {error && <p role="alert" className="text-destructive">Report load nahi hui. Refresh karke dobara try karein.</p>}
    {isFetching && <p role="status" className="text-muted-foreground">Provider rates aur balances check ho rahe hain…</p>}
    {incomplete && <div role="alert" className="flex items-start gap-2 border border-border bg-muted p-4 text-sm"><AlertTriangle className="h-5 w-5 shrink-0 text-destructive" /><span>{unknown} runs ka provider rate verify nahi hua, ya balance unavailable hai. Neeche ke amounts incomplete hain; abhi top-up plan copy nahi hoga.</span></div>}
    {data && <>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-border py-5">
        {[['Unsent Pending Runs',totalRuns.toLocaleString()],['Verified Provider Cost',inr(cost)],['Verified Balance',inr(balance)],['Required Top-up',incomplete ? 'Incomplete' : inr(topup)]].map(([label,value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold text-foreground break-words">{value}</p></div>)}
      </section>
      <section className="space-y-3"><h2 className="font-bold">Per-Provider Balance vs Need</h2><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Provider</TableHead><TableHead className="text-right">Pending Runs</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="text-right">Top-up</TableHead></TableRow></TableHeader><TableBody>{providers.map(p => <TableRow key={p.provider_id}><TableCell className="font-medium">{p.provider_name}</TableCell><TableCell className="text-right">{p.pending_runs}</TableCell><TableCell className="text-right">{inr(p.cost_inr)}{p.unknown_runs > 0 && <span className="block text-xs text-destructive">{p.unknown_runs} unpriced</span>}</TableCell><TableCell className="text-right">{p.balance_unknown ? 'Unavailable' : inr(p.balance_inr)}</TableCell><TableCell className="text-right font-bold">{p.unknown_runs || p.balance_unknown ? 'Incomplete' : inr(Math.max(0,p.cost_inr-p.balance_inr))}</TableCell></TableRow>)}</TableBody></Table></div></section>
      <section className="space-y-3"><h2 className="font-bold">Service-wise Unsent Work</h2><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Provider</TableHead><TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">Runs</TableHead></TableRow></TableHeader><TableBody>{data.breakdown.map(r => <TableRow key={`${r.provider_id}:${r.service_id}`}><TableCell>{r.service_name}</TableCell><TableCell>{providers.find(p => p.provider_id === r.provider_id)?.provider_name}</TableCell><TableCell className="text-right">{r.pending_quantity.toLocaleString()}</TableCell><TableCell className="text-right">{r.pending_runs}</TableCell></TableRow>)}</TableBody></Table></div></section>
      <section className="space-y-3"><h2 className="font-bold">Top 5 Users — Remaining Paid Value</h2><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead className="text-right">Orders</TableHead><TableHead className="text-right">Remaining Paid Value</TableHead><TableHead className="text-right">Wallet</TableHead><TableHead className="text-right">Spent</TableHead></TableRow></TableHeader><TableBody>{data.top_users.map(u => <TableRow key={u.user_id}><TableCell><p>{u.full_name}</p><p className="text-xs text-muted-foreground">{u.email}</p></TableCell><TableCell className="text-right">{u.pending_orders}</TableCell><TableCell className="text-right font-bold">{inr(u.pending_value_inr)}</TableCell><TableCell className="text-right">{inr(u.wallet_inr)}</TableCell><TableCell className="text-right">{inr(u.spent_inr)}</TableCell></TableRow>)}</TableBody></Table></div></section>
      <p className="text-xs text-muted-foreground">Last checked: {new Date(data.generated_at).toLocaleString('en-IN')}</p>
    </>}
  </div></DashboardLayout>;
}
