import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Coins,
  CreditCard,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  Wallet,
  Ban,
  ShieldCheck,
  Layers,
  Trophy,
  UserPlus,
  Activity,
  RotateCcw,
  XCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  RANGE_LABELS,
  resolveRange,
  inr,
  num,
  toCsv,
  downloadCsv,
  type RangeKey,
} from '@/lib/admin-analytics';
import { AnalyticsRangeBar } from './AnalyticsRangeBar';
import { AnalyticsStatCard } from './AnalyticsStatCard';

interface AnalyticsPayload {
  from: string;
  to: string;
  current: {
    financial: Record<string, number>;
    orders: Record<string, number>;
    users: Record<string, number>;
  };
  previous: Record<string, number>;
  lifetime: Record<string, number>;
  platforms: Array<{ platform: string; count: number }>;
  platforms_spent: Array<{ platform: string; spent: number; count: number }>;
  top_depositors: Array<{ user_id: string; email: string; full_name: string; amount: number; n: number }>;
  top_spenders: Array<{ user_id: string; email: string; full_name: string; amount: number; n: number }>;
  top_orders: Array<{ user_id: string; email: string; full_name: string; n: number }>;
}

export function AnalyticsPanel() {
  const [rangeKey, setRangeKey] = useState<RangeKey>('last7');
  const [custom, setCustom] = useState<{ from: Date; to: Date } | undefined>();

  const { from, to } = useMemo(() => resolveRange(rangeKey, custom), [rangeKey, custom]);

  const {
    data,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-analytics', from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_analytics' as any, {
        p_from: from.toISOString(),
        p_to: to.toISOString(),
      });
      if (error) throw error;
      return data as unknown as AnalyticsPayload;
    },
    staleTime: 30_000,
  });

  const fin = data?.current?.financial ?? {};
  const ord = data?.current?.orders ?? {};
  const usr = data?.current?.users ?? {};
  const prev = data?.previous ?? {};
  const life = data?.lifetime ?? {};

  const handleChange = (v: RangeKey, c?: { from: Date; to: Date }) => {
    setRangeKey(v);
    if (c) setCustom(c);
  };

  const handleExport = () => {
    if (!data) return;
    const flat = {
      range: RANGE_LABELS[rangeKey],
      from: data.from,
      to: data.to,
      ...Object.fromEntries(Object.entries(fin).map(([k, v]) => [`financial_${k}`, v])),
      ...Object.fromEntries(Object.entries(ord).map(([k, v]) => [`orders_${k}`, v])),
      ...Object.fromEntries(Object.entries(usr).map(([k, v]) => [`users_${k}`, v])),
      current_wallet_total: life.current_wallet_total,
    };
    const csv = [
      toCsv([flat]),
      '',
      'Platform Breakdown',
      toCsv(data.platforms),
      '',
      'Top Depositors',
      toCsv(data.top_depositors),
      '',
      'Top Spenders',
      toCsv(data.top_spenders),
      '',
      'Top by Orders',
      toCsv(data.top_orders),
    ].join('\n');
    downloadCsv(`analytics-${rangeKey}-${data.from.slice(0, 10)}.csv`, csv);
  };

  return (
    <div className="space-y-5">
      <AnalyticsRangeBar
        value={rangeKey}
        custom={custom}
        onChange={handleChange}
        onRefresh={() => refetch()}
        onExport={handleExport}
        isFetching={isFetching}
      />

      {/* Financial */}
      <Section title="Financial" icon={<DollarSign className="h-4 w-4" />}>
        <AnalyticsStatCard
          label="Total Deposits"
          value={inr(fin.total_deposits)}
          icon={<Coins className="h-4 w-4" />}
          current={Number(fin.total_deposits || 0)}
          previous={Number(prev.total_deposits || 0)}
          accent="success"
          hint={`${num(fin.deposits_count)} deposits`}
        />
        <AnalyticsStatCard
          label="Total Spent (All Users)"
          value={inr(fin.total_spent)}
          icon={<CreditCard className="h-4 w-4" />}
          current={Number(fin.total_spent || 0)}
          previous={Number(prev.total_spent || 0)}
          accent="warning"
          hint="Wallet spent on orders"
        />
        <AnalyticsStatCard
          label="Gross Revenue"
          value={inr(ord.gross_revenue)}
          icon={<TrendingUp className="h-4 w-4" />}
          current={Number(ord.gross_revenue || 0)}
          previous={Number(prev.gross_revenue || 0)}
          accent="primary"
        />
        <AnalyticsStatCard
          label="Net Revenue"
          value={inr(Number(fin.total_deposits || 0) - Number(fin.refunded_amount || 0))}
          icon={<DollarSign className="h-4 w-4" />}
          accent="success"
          hint="Deposits − Refunds"
        />
        <AnalyticsStatCard
          label="Refunded"
          value={inr(fin.refunded_amount)}
          icon={<RotateCcw className="h-4 w-4" />}
          accent="warning"
        />
        <AnalyticsStatCard label="Avg Deposit" value={inr(fin.avg_deposit)} icon={<BarChart3 className="h-4 w-4" />} />
        <AnalyticsStatCard label="Largest Deposit" value={inr(fin.largest_deposit)} icon={<TrendingUp className="h-4 w-4" />} accent="success" />
        <AnalyticsStatCard label="Smallest Deposit" value={inr(fin.smallest_deposit)} icon={<TrendingUp className="h-4 w-4" />} accent="muted" />
        <AnalyticsStatCard label="Pending Deposits" value={inr(fin.pending_deposits)} icon={<Clock className="h-4 w-4" />} accent="warning" />
        <AnalyticsStatCard label="Failed Deposits" value={inr(fin.failed_deposits)} icon={<XCircle className="h-4 w-4" />} accent="destructive" />
      </Section>

      {/* Orders */}
      <Section title="Orders" icon={<Package className="h-4 w-4" />}>
        <AnalyticsStatCard
          label="Total Orders"
          value={num(ord.total_orders)}
          icon={<Package className="h-4 w-4" />}
          current={Number(ord.total_orders || 0)}
          previous={Number(prev.total_orders || 0)}
        />
        <AnalyticsStatCard label="Completed" value={num(ord.completed_orders)} icon={<CheckCircle2 className="h-4 w-4" />} accent="success" />
        <AnalyticsStatCard label="Processing" value={num(ord.processing_orders)} icon={<Activity className="h-4 w-4" />} accent="primary" />
        <AnalyticsStatCard label="Pending" value={num(ord.pending_orders)} icon={<Clock className="h-4 w-4" />} accent="warning" />
        <AnalyticsStatCard label="Cancelled" value={num(ord.cancelled_orders)} icon={<XCircle className="h-4 w-4" />} accent="muted" />
        <AnalyticsStatCard label="Failed" value={num(ord.failed_orders)} icon={<XCircle className="h-4 w-4" />} accent="destructive" />
        <AnalyticsStatCard label="Refunded" value={num(ord.refunded_orders)} icon={<RotateCcw className="h-4 w-4" />} accent="warning" />
        <AnalyticsStatCard label="Avg Order Value" value={inr(ord.avg_order_value)} icon={<BarChart3 className="h-4 w-4" />} />
        <AnalyticsStatCard label="Highest Order" value={inr(ord.highest_order_value)} icon={<TrendingUp className="h-4 w-4" />} accent="success" />
        <AnalyticsStatCard label="Lowest Order" value={inr(ord.lowest_order_value)} icon={<TrendingUp className="h-4 w-4" />} accent="muted" />
      </Section>

      {/* Users */}
      <Section title="Users" icon={<Users className="h-4 w-4" />}>
        <AnalyticsStatCard
          label="New Registrations"
          value={num(usr.new_users)}
          icon={<UserPlus className="h-4 w-4" />}
          current={Number(usr.new_users || 0)}
          previous={Number(prev.new_users || 0)}
          accent="success"
        />
        <AnalyticsStatCard label="Active Users" value={num(usr.active_users)} icon={<Activity className="h-4 w-4" />} accent="primary" hint="Signed in during range" />
        <AnalyticsStatCard label="Users Who Deposited" value={num(usr.users_who_deposited)} icon={<Wallet className="h-4 w-4" />} accent="success" />
        <AnalyticsStatCard label="VIP Users (Lifetime)" value={num(life.vip_users)} icon={<ShieldCheck className="h-4 w-4" />} accent="primary" hint="≥ $100 deposited" />
        <AnalyticsStatCard label="Banned Users" value={num(life.banned_users)} icon={<Ban className="h-4 w-4" />} accent="destructive" />
        <AnalyticsStatCard label="Total Users (Lifetime)" value={num(life.lifetime_users)} icon={<Users className="h-4 w-4" />} accent="muted" />
      </Section>

      {/* Wallet */}
      <Section title="Wallet" icon={<Wallet className="h-4 w-4" />}>
        <AnalyticsStatCard label="Live Wallet Balance" value={inr(life.current_wallet_total)} icon={<Wallet className="h-4 w-4" />} accent="primary" hint="All users, right now" />
        <AnalyticsStatCard label="Wallet Credits (Range)" value={inr(fin.wallet_credits)} icon={<TrendingUp className="h-4 w-4" />} accent="success" />
        <AnalyticsStatCard label="Wallet Debits (Range)" value={inr(fin.wallet_debits)} icon={<CreditCard className="h-4 w-4" />} accent="warning" />
      </Section>

      {/* Platforms */}
      <Section title="Platform Breakdown" icon={<Layers className="h-4 w-4" />}>
        {(data?.platforms ?? []).map((p) => (
          <AnalyticsStatCard
            key={p.platform}
            label={p.platform}
            value={num(p.count)}
            icon={<Package className="h-4 w-4" />}
            hint="orders"
          />
        ))}
        {(!data?.platforms || data.platforms.length === 0) && (
          <p className="text-sm text-muted-foreground col-span-full">No orders in this range.</p>
        )}
      </Section>

      {/* Top lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopList
          title="Top 10 Depositors"
          icon={<Trophy className="h-4 w-4 text-success" />}
          rows={(data?.top_depositors ?? []).map((r) => ({
            name: r.full_name || r.email,
            sub: r.email,
            metric: inr(r.amount),
            hint: `${num(r.n)} deposits`,
          }))}
        />
        <TopList
          title="Top 10 Spenders"
          icon={<Trophy className="h-4 w-4 text-primary" />}
          rows={(data?.top_spenders ?? []).map((r) => ({
            name: r.full_name || r.email,
            sub: r.email,
            metric: inr(r.amount),
            hint: `${num(r.n)} orders`,
          }))}
        />
        <TopList
          title="Top 10 by Orders"
          icon={<Trophy className="h-4 w-4 text-warning" />}
          rows={(data?.top_orders ?? []).map((r) => ({
            name: r.full_name || r.email,
            sub: r.email,
            metric: num(r.n),
            hint: 'orders',
          }))}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {children}
      </div>
    </div>
  );
}

function TopList({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  rows: Array<{ name: string; sub: string; metric: string; hint?: string }>;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="text-sm font-semibold">{title}</h3>
          <Badge variant="outline" className="ml-auto text-[10px] h-5">
            {rows.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {rows.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">No data in this range.</p>
          )}
          {rows.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold shrink-0">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{r.sub}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold tabular-nums">{r.metric}</p>
                {r.hint && <p className="text-[10px] text-muted-foreground">{r.hint}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
