import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useWallet } from '@/hooks/useWallet';
import { useTransactions, type TransactionFilter } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';
import ZapUpiDepositCard from '@/components/wallet/ZapUpiDepositCard';
import OxaPayAddFunds from '@/components/wallet/OxaPayAddFunds';
import ManualFundCard from '@/components/wallet/ManualFundCard';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ExternalLink,
  IndianRupee,
  Zap,
} from 'lucide-react';

type PayMethod = 'upi' | 'crypto' | 'manual';

export default function Wallet() {
  const { wallet } = useWallet();
  const { formatPrice, rates } = useCurrency();
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [payMethod, setPayMethod] = useState<PayMethod>('upi');
  const { data: transactions } = useTransactions(filter);
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
          onClick: () => window.open('https://t.me/Hkasdfgkl', '_blank'),
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
        <div className="space-y-4">
          <div className="inline-flex p-1 rounded-xl bg-secondary border border-border">
            {([
              { id: 'upi' as const, label: 'Instant UPI', tag: 'UPI' },
              { id: 'crypto' as const, label: 'Pay with Crypto', tag: 'CRYPTO' },
              { id: 'manual' as const, label: 'Talk to Admin', tag: 'MANUAL' },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPayMethod(opt.id)}
                className={cn(
                  'h-9 px-4 text-xs md:text-sm font-semibold rounded-lg transition-colors',
                  payMethod === opt.id
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5">
            {payMethod === 'upi' && <ZapUpiDepositCard />}
            {payMethod === 'crypto' && <OxaPayAddFunds />}
            {payMethod === 'manual' && <ManualFundCard />}
          </div>
        </div>



        {/* Transactions */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-4 md:p-5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-base font-bold text-foreground">Transactions</h2>
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
              <div className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</div>
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
                    {tx.type === 'order' ? '-' : '+'}{formatPrice(Math.abs(Number(tx.displayAmount || 0)))}
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
        </div>
      </div>
    </DashboardLayout>
  );
}


