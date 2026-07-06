import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useWallet } from '@/hooks/useWallet';
import { useTransactions, useWalletSummary, type TransactionFilter } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';
import ZapUpiDepositCard from '@/components/wallet/ZapUpiDepositCard';
import OxaPayAddFunds from '@/components/wallet/OxaPayAddFunds';
import ManualFundCard from '@/components/wallet/ManualFundCard';
import {
  WalletDateFilter,
  resolveWalletRange,
  type WalletRangeKey,
} from '@/components/wallet/WalletDateFilter';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  IndianRupee,
  Zap,
  Bitcoin,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';

type PayMethod = 'upi' | 'crypto' | 'manual';

export default function Wallet() {
  const { wallet } = useWallet();
  const { formatPrice, rates } = useCurrency();
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [payMethod, setPayMethod] = useState<PayMethod>('upi');
  const [rangeKey, setRangeKey] = useState<WalletRangeKey>('lifetime');
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();
  const [pageSize, setPageSize] = useState(100);

  const { from, to } = useMemo(
    () => resolveWalletRange(rangeKey, customRange),
    [rangeKey, customRange]
  );
  const fromISO = from?.toISOString();
  const toISO = to?.toISOString();

  const { data: transactions } = useTransactions(filter, {
    from: fromISO,
    to: toISO,
    limit: pageSize,
  });
  const { data: summary } = useWalletSummary(fromISO, toISO);
  const qc = useQueryClient();


  // Handle ZapUPI return — poll server-verify until the order is credited (or give up after ~3 min).
  useEffect(() => {
    const url = new URL(window.location.href);
    const orderId = url.searchParams.get('zapupi_order_id') || url.searchParams.get('deposit_order_id') || url.searchParams.get('order_id');
    const status = (url.searchParams.get('status') || '').toLowerCase();
    if (!orderId) return;

    const cleanUrl = () => {
      url.searchParams.delete('order_id');
      url.searchParams.delete('zapupi_order_id');
      url.searchParams.delete('deposit_order_id');
      url.searchParams.delete('gateway_order_id');
      url.searchParams.delete('txn_id');
      url.searchParams.delete('utr');
      url.searchParams.delete('status');
      window.history.replaceState({}, '', url.pathname + (url.search ? `?${url.searchParams}` : ''));
    };

    const claimedKey = `zapupi_claimed_${orderId}`;
    const inflightKey = `zapupi_inflight_${orderId}`;

    // Already credited in a previous visit/tab → instant message, no re-claim.
    if (sessionStorage.getItem(claimedKey) === 'done' || localStorage.getItem(claimedKey) === 'done') {
      toast.success('This payment is already credited to your wallet.');
      cleanUrl();
      return;
    }

    // Another tab/poll is already verifying the same order → don't duplicate.
    const inflightAt = Number(sessionStorage.getItem(inflightKey) || '0');
    if (inflightAt && Date.now() - inflightAt < 60_000) {
      toast.info('Payment is already being verified…');
      return;
    }
    sessionStorage.setItem(inflightKey, String(Date.now()));

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 36; // ~3 minutes at 5s
    const pendingToast = toast.loading('Verifying payment…');

    if (status === 'failed' || status === 'timeout' || status === 'cancelled' || status === 'cancel') {
      toast.error(status === 'timeout' ? 'Payment timed out' : 'Payment cancelled or failed', { id: pendingToast });
      sessionStorage.removeItem(inflightKey);
      cleanUrl();
      return;
    }

    const poll = async () => {
      if (cancelled) return;
      attempts++;
      try {
        const { data, error } = await supabase.functions.invoke('zapupi-sync-deposit', {
          body: { order_id: orderId },
        });
        if (error) throw new Error(error.message);
        const res = data as any;
        const credited = res?.credited;
        const already = res?.already || res?.result?.duplicate;
        if (credited || already) {
          localStorage.setItem(claimedKey, 'done');
          sessionStorage.setItem(claimedKey, 'done');
          sessionStorage.removeItem(inflightKey);
          toast.success(
            already ? 'Already credited to your wallet.' : 'Payment successful — wallet credited',
            { id: pendingToast },
          );
          qc.invalidateQueries({ queryKey: ['wallet'] });
          qc.invalidateQueries({ queryKey: ['transactions'] });
          cleanUrl();
          return;
        }
      } catch {
        // ignore and retry
      }
      if (attempts >= maxAttempts) {
        if (status === 'failed') {
          toast.error('Payment failed or cancelled', { id: pendingToast });
        } else {
          toast.info('Payment not confirmed yet. If you paid, balance will update shortly.', { id: pendingToast });
        }
        sessionStorage.removeItem(inflightKey);
        qc.invalidateQueries({ queryKey: ['wallet'] });
        qc.invalidateQueries({ queryKey: ['transactions'] });
        cleanUrl();
        return;
      }
      setTimeout(poll, 3000);
    };

    poll();
    return () => {
      cancelled = true;
      sessionStorage.removeItem(inflightKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle OxaPay return — verify order and credit wallet (with retry + specific errors)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('oxapay') !== 'success') return;
    const orderId = url.searchParams.get('oxapay_order_id');
    if (!orderId) return;

    const cleanUrl = () => {
      url.searchParams.delete('oxapay');
      url.searchParams.delete('oxapay_order_id');
      window.history.replaceState({}, '', url.pathname + (url.search ? `?${url.searchParams}` : ''));
    };

    const claimedKey = `oxapay_claimed_${orderId}`;
    if (localStorage.getItem(claimedKey) === 'done') {
      toast.success('This crypto payment is already credited.');
      cleanUrl();
      return;
    }

    // Track unresolved orders so user can retry manually later
    const pendingKey = 'oxapay_pending_orders';
    const addPending = () => {
      try {
        const list: string[] = JSON.parse(localStorage.getItem(pendingKey) || '[]');
        if (!list.includes(orderId)) list.push(orderId);
        localStorage.setItem(pendingKey, JSON.stringify(list));
      } catch {}
    };
    const removePending = () => {
      try {
        const list: string[] = JSON.parse(localStorage.getItem(pendingKey) || '[]');
        localStorage.setItem(pendingKey, JSON.stringify(list.filter((x) => x !== orderId)));
      } catch {}
    };

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30; // ~2.5 min at 5s
    let lastUserMessage = 'Verifying crypto payment…';
    const pendingToast = toast.loading(lastUserMessage);

    const succeed = (msg: string) => {
      localStorage.setItem(claimedKey, 'done');
      removePending();
      toast.success(msg, { id: pendingToast });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      cleanUrl();
    };

    const failHard = (msg: string) => {
      removePending();
      toast.error(msg, {
        id: pendingToast,
        duration: 12000,
        action: {
          label: 'Contact support',
          onClick: () => window.open('https://t.me/multysmm', '_blank'),
        },
      });
      cleanUrl();
    };

    const failSoft = (msg: string) => {
      addPending();
      toast.warning(msg, {
        id: pendingToast,
        duration: 15000,
        description: 'Order ID: ' + orderId,
        action: {
          label: 'Retry now',
          onClick: () => {
            attempts = 0;
            poll();
          },
        },
      });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      cleanUrl();
    };

    const poll = async () => {
      if (cancelled) return;
      attempts++;
      let transient = false;
      try {
        const { data, error } = await supabase.functions.invoke('oxapay-sync-deposit', {
          body: { order_id: orderId },
        });
        const res = (data ?? {}) as any;

        if (error && !res?.code) {
          transient = true;
        } else if (res?.credited || res?.duplicate) {
          succeed(res.duplicate ? 'Already credited to your wallet.' : 'Crypto payment received — wallet credited.');
          return;
        } else if (res?.code === 'CURRENCY_MISMATCH' || res?.code === 'NOT_FOUND' || res?.code === 'FORBIDDEN') {
          failHard(res.user_message || 'Payment could not be verified.');
          return;
        } else if (res?.user_message) {
          lastUserMessage = res.user_message;
          toast.loading(lastUserMessage + ` (${attempts}/${maxAttempts})`, { id: pendingToast });
        }
      } catch {
        transient = true;
      }

      if (attempts >= maxAttempts) {
        failSoft(
          transient
            ? 'Network issue verifying payment. Tap Retry when you have connection.'
            : 'Payment not confirmed yet. You can retry — funds auto-credit when the network confirms.',
        );
        return;
      }
      setTimeout(poll, 5000);
    };

    poll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On mount, offer to re-verify any previously-pending orders
  useEffect(() => {
    let list: string[] = [];
    try { list = JSON.parse(localStorage.getItem('oxapay_pending_orders') || '[]'); } catch {}
    if (!list.length) return;

    const runOne = async (orderId: string) => {
      try {
        const { data } = await supabase.functions.invoke('oxapay-sync-deposit', {
          body: { order_id: orderId },
        });
        const res = (data ?? {}) as any;
        if (res?.credited || res?.duplicate) {
          localStorage.setItem(`oxapay_claimed_${orderId}`, 'done');
          try {
            const now: string[] = JSON.parse(localStorage.getItem('oxapay_pending_orders') || '[]');
            localStorage.setItem('oxapay_pending_orders', JSON.stringify(now.filter((x) => x !== orderId)));
          } catch {}
          toast.success('Previous crypto payment credited to your wallet.');
          qc.invalidateQueries({ queryKey: ['wallet'] });
          qc.invalidateQueries({ queryKey: ['transactions'] });
        }
      } catch {}
    };
    list.forEach(runOne);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="h-4 w-4" style={{ color: '#10b981' }} />;
      case 'order': return <ArrowUpRight className="h-4 w-4" style={{ color: '#ef4444' }} />;
      case 'refund': return <RefreshCw className="h-4 w-4" style={{ color: '#16a34a' }} />;
      default: return <WalletIcon className="h-4 w-4" style={{ color: '#999' }} />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'deposit': return 'rgba(16,185,129,.1)';
      case 'order': return 'rgba(239,68,68,.1)';
      case 'refund': return 'rgba(22, 163, 74,.1)';
      default: return 'rgba(0,0,0,.04)';
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'deposit': return '#10b981';
      case 'order': return '#ef4444';
      case 'refund': return '#16a34a';
      default: return '#1a1a2e';
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const displayTransactions = (() => {
    if (!transactions?.length) return [];

    const adjustments = new Map<string, number>();
    const inrRate = rates.INR || 83.5;

    for (const tx of transactions) {
      if (tx.payment_method !== 'razorpay_auto' || !tx.payment_reference) continue;

      const originalReference = tx.payment_reference.endsWith('_exact_credit_fix')
        ? tx.payment_reference.replace(/_exact_credit_fix$/, '')
        : tx.payment_reference.endsWith('_fee_adjust')
          ? tx.payment_reference.replace(/_fee_adjust$/, '')
          : null;

      if (!originalReference) continue;
      adjustments.set(originalReference, (adjustments.get(originalReference) || 0) + Number(tx.amount || 0));
    }

    return transactions
      .filter((tx) => !(tx.payment_method === 'razorpay_auto' && tx.payment_reference && (tx.payment_reference.endsWith('_exact_credit_fix') || tx.payment_reference.endsWith('_fee_adjust'))))
      .map((tx) => {
        const adjustment = tx.payment_method === 'razorpay_auto' && tx.payment_reference
          ? adjustments.get(tx.payment_reference) || 0
          : 0;

        const displayAmount = Number(tx.amount || 0) + adjustment;
        const displayBalanceAfter = tx.balance_after != null
          ? Number(tx.balance_after) + adjustment
          : null;

        const displayDescription = tx.payment_method === 'razorpay_auto' && adjustment !== 0
          ? `Wallet top-up via Razorpay (₹${(displayAmount * inrRate).toFixed(2)} exact credit)`
          : (tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1));

        return {
          ...tx,
          displayAmount,
          displayBalanceAfter,
          displayDescription,
        };
      });
  })();

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Balance header */}
        <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 border border-border bg-card shadow-[0_10px_40px_-12px_rgba(0,0,0,0.08)]">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20">
                <WalletIcon className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Wallet Balance</p>
                <p className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                  {formatPrice(wallet?.balance || 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
              Updates in real-time
            </div>
          </div>
        </div>

        {/* Add Funds — method selector */}
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)]">
            <div className="grid grid-cols-3 gap-1.5 relative">
              {([
                { id: 'upi' as const, label: 'Instant UPI', sub: 'GPay · PhonePe · Paytm', icon: Zap, gradient: 'from-purple-500 to-pink-500', ring: 'ring-purple-500/30' },
                { id: 'crypto' as const, label: 'Pay with Crypto', sub: 'USDT · BTC · TRX · LTC', icon: Bitcoin, gradient: 'from-amber-500 to-orange-500', ring: 'ring-amber-500/30' },
                { id: 'manual' as const, label: 'Talk to Admin', sub: 'Custom / bulk top-ups', icon: MessageCircle, gradient: 'from-sky-500 to-blue-600', ring: 'ring-sky-500/30' },
              ]).map((opt) => {
                const active = payMethod === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setPayMethod(opt.id)}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 md:px-4 py-3 text-left transition-all duration-300 overflow-hidden',
                      active
                        ? `bg-gradient-to-br ${opt.gradient} text-white shadow-lg ring-2 ${opt.ring} scale-[1.02]`
                        : 'bg-secondary/50 text-foreground hover:bg-secondary hover:scale-[1.01]'
                    )}
                  >
                    {active && (
                      <span className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/20 blur-2xl pointer-events-none" />
                    )}
                    <span
                      className={cn(
                        'relative flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg shrink-0 transition-colors',
                        active ? 'bg-white/20 backdrop-blur-sm' : `bg-gradient-to-br ${opt.gradient} text-white`
                      )}
                    >
                      <Icon className="h-4 w-4 md:h-5 md:w-5" />
                    </span>
                    <span className="relative flex-1 min-w-0">
                      <span className={cn('block text-xs md:text-sm font-bold leading-tight truncate', active ? 'text-white' : 'text-foreground')}>
                        {opt.label}
                      </span>
                      <span className={cn('hidden md:block text-[10px] mt-0.5 truncate', active ? 'text-white/80' : 'text-muted-foreground')}>
                        {opt.sub}
                      </span>
                    </span>
                    {active && (
                      <span className="hidden md:block absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-white/60" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300" key={payMethod}>
            {payMethod === 'upi' && <ZapUpiDepositCard />}
            {payMethod === 'crypto' && <OxaPayAddFunds />}
            {payMethod === 'manual' && <ManualFundCard />}
          </div>
        </div>

        {/* Wallet analytics — date filter + summary cards */}
        <div className="rounded-2xl border border-border bg-card p-4 md:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-foreground">Wallet Analytics</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Deposits &amp; spending for the selected period
              </p>
            </div>
            <WalletDateFilter
              value={rangeKey}
              custom={customRange}
              onChange={(k, c) => {
                setRangeKey(k);
                if (c) setCustomRange(c);
                setPageSize(100);
              }}
            />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard
              label="Total Deposit"
              value={formatPrice(summary?.deposit ?? 0)}
              icon={<TrendingUp className="h-4 w-4" />}
              tone="success"
              hint={rangeKey === 'lifetime' ? 'Lifetime' : 'In selected range'}
            />
            <SummaryCard
              label="Total Spent"
              value={formatPrice(summary?.spent ?? 0)}
              icon={<TrendingDown className="h-4 w-4" />}
              tone="danger"
              hint={rangeKey === 'lifetime' ? 'Lifetime' : 'In selected range'}
            />
            <SummaryCard
              label="Current Balance"
              value={formatPrice(wallet?.balance || 0)}
              icon={<WalletIcon className="h-4 w-4" />}
              tone="primary"
              hint="Live · not filtered"
            />
            <SummaryCard
              label="Transactions"
              value={String(summary?.count ?? 0)}
              icon={<Activity className="h-4 w-4" />}
              tone="muted"
              hint={rangeKey === 'lifetime' ? 'Lifetime' : 'In selected range'}
            />
          </div>
        </div>

        {/* Transactions */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-4 md:p-5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-bold text-foreground">Transactions</h2>
              <span className="text-[11px] text-muted-foreground">
                Filtered by selected period
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all','deposit','order','refund'] as TransactionFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'h-7 px-3 text-[11px] font-semibold rounded-md capitalize transition-colors',
                    filter === f
                      ? 'bg-foreground text-background'
                      : 'bg-secondary text-foreground hover:bg-muted'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border">
            {displayTransactions.length === 0 && (
              <div className="p-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <WalletIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No wallet activity found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Nothing here for the selected date range.
                </p>
              </div>
            )}
            {displayTransactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: getIconBg(tx.type) }}
                >
                  {getIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {tx.displayDescription}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{fmtDate(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: getAmountColor(tx.type) }}>
                    {tx.type === 'order' || tx.type === 'order_payment' ? '-' : '+'}
                    {formatPrice(Math.abs(Number(tx.displayAmount || 0)))}
                  </p>
                  {tx.displayBalanceAfter != null && (
                    <p className="text-[10px] text-muted-foreground">
                      Bal: {formatPrice(Number(tx.displayBalanceAfter))}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {displayTransactions.length >= pageSize && (
            <div className="p-3 border-t border-border flex justify-center">
              <button
                onClick={() => setPageSize((n) => n + 100)}
                className="h-8 px-4 text-xs font-semibold rounded-md bg-secondary text-foreground hover:bg-muted transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'success' | 'danger' | 'primary' | 'muted';
  hint?: string;
}) {
  const toneClasses: Record<typeof tone, string> = {
    success: 'text-success bg-success/10',
    danger: 'text-destructive bg-destructive/10',
    primary: 'text-primary bg-primary/10',
    muted: 'text-muted-foreground bg-muted',
  } as const;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            {label}
          </p>
          <p className="text-lg md:text-xl font-extrabold tabular-nums mt-1 truncate text-foreground">
            {value}
          </p>
          {hint && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
            toneClasses[tone]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}



