import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useWallet } from '@/hooks/useWallet';
import { useTransactions, type TransactionFilter } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';
import ZapUpiDepositCard from '@/components/wallet/ZapUpiDepositCard';
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

export default function Wallet() {
  const { wallet } = useWallet();
  const { formatPrice, rates } = useCurrency();
  const [filter, setFilter] = useState<TransactionFilter>('all');
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
      <div className="space-y-6">
        <div>
          <h1 className="text-[40px] leading-[1.05] tracking-tight" style={{ color: '#efe7d4', fontFamily: "'Instrument Serif', serif", fontWeight: 400 }}>
            Your <em style={{ color: '#f0d78c' }}>wallet</em>
          </h1>
          <p className="text-[13px] mt-2" style={{ color: 'rgba(239,231,212,.55)' }}>Manage your balance and transactions.</p>
        </div>

        {/* Balance Card — Noir & Gold */}
        <div
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: 'radial-gradient(120% 120% at 0% 0%, #1c1a13 0%, #0d0d0d 60%), #0d0d0d',
            border: '1px solid rgba(201,168,76,.22)',
            boxShadow: '0 24px 60px -20px rgba(201,168,76,.30), inset 0 1px 0 rgba(255,255,255,.04)',
          }}
        >
          <div aria-hidden className="absolute -top-16 -right-12 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(closest-side, rgba(201,168,76,.30), transparent 70%)' }} />
          <div aria-hidden className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(closest-side, rgba(240,215,140,.18), transparent 70%)' }} />
          {/* gold filigree */}
          <div aria-hidden className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,.6), transparent)' }} />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg"
                style={{ background: 'rgba(201,168,76,.14)', border: '1px solid rgba(201,168,76,.25)' }}>
                <WalletIcon className="h-3.5 w-3.5" style={{ color: '#f0d78c' }} />
              </span>
              <p className="text-[10px] font-semibold uppercase" style={{ color: '#c9a84c', letterSpacing: '0.20em' }}>
                Available Balance
              </p>
            </div>
            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(201,168,76,.14)', color: '#f0d78c', letterSpacing: '0.06em', border: '1px solid rgba(201,168,76,.25)' }}>
              INR
            </div>
          </div>

          <p className="relative z-10 mt-3 text-4xl md:text-5xl"
            style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.05, color: '#efe7d4' }}>
            ₹<span className="gold-shimmer">{formatPrice(wallet?.balance || 0).replace('₹', '')}</span>
          </p>

          <div className="relative z-10 mt-4 pt-4 grid grid-cols-2 gap-3"
            style={{ borderTop: '1px solid rgba(201,168,76,.18)' }}>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.22)' }}>
                <ArrowDownLeft className="h-3.5 w-3.5" style={{ color: '#f0d78c' }} />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase" style={{ color: '#c9a84c', letterSpacing: '0.16em' }}>Total In</p>
                <p className="text-[14px] truncate" style={{ color: '#efe7d4', fontFamily: "'Instrument Serif', serif" }}>
                  {formatPrice(wallet?.total_deposited || 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.22)' }}>
                <ArrowUpRight className="h-3.5 w-3.5" style={{ color: '#f0d78c' }} />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase" style={{ color: '#c9a84c', letterSpacing: '0.16em' }}>Total Out</p>
                <p className="text-[14px] truncate" style={{ color: '#efe7d4', fontFamily: "'Instrument Serif', serif" }}>
                  {formatPrice(wallet?.total_spent || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Deposit Section — ZapUPI auto-credit */}
        <ZapUpiDepositCard />

        {/* Transaction History */}
        <div className="rounded-2xl p-6"
          style={{ background: '#141414', border: '1px solid rgba(201,168,76,.18)', boxShadow: '0 10px 30px -12px rgba(0,0,0,.7)' }}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-2xl tracking-tight" style={{ color: '#efe7d4', fontFamily: "'Instrument Serif', serif" }}>
              Transaction <em style={{ color: '#f0d78c' }}>history</em>
            </h2>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0a0a0a', border: '1px solid rgba(201,168,76,.14)' }}>
              {(['all', 'deposit', 'order', 'refund'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                  style={{
                    background: filter === f ? 'linear-gradient(135deg, #f0d78c, #c9a84c)' : 'transparent',
                    color: filter === f ? '#0a0a0a' : 'rgba(239,231,212,.6)',
                  }}
                >
                  {f === 'all' ? 'All' : f === 'deposit' ? 'Deposits' : f === 'order' ? 'Orders' : 'Refunds'}
                </button>
              ))}
            </div>
          </div>


          {displayTransactions.length > 0 ? (
            <div className="space-y-2">
              {displayTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-xl transition-colors"
                  style={{ background: 'rgba(0,0,0,.015)', border: '1px solid rgba(0,0,0,.04)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: getIconBg(tx.type) }}>
                      {getIcon(tx.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[13px] leading-tight truncate max-w-[260px]" style={{ color: '#1a1a2e' }}>
                        {tx.displayDescription}
                      </p>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1">
                        {tx.payment_method && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,.04)', color: '#888' }}>
                            {tx.payment_method.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        )}
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                          style={{
                            background: tx.status === 'pending' ? 'rgba(245,158,11,.1)' : tx.status === 'completed' ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
                            color: tx.status === 'pending' ? '#f59e0b' : tx.status === 'completed' ? '#10b981' : '#ef4444',
                          }}
                        >
                          {tx.status}
                        </span>
                        <span className="text-[11px]" style={{ color: '#bbb' }}>{fmtDate(tx.created_at!)}</span>
                        {tx.payment_reference && tx.payment_method === 'usdt_bep20' && (
                          <a
                            href={`https://bscscan.com/tx/${tx.payment_reference}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] flex items-center gap-0.5 hover:underline"
                            style={{ color: '#16a34a' }}
                          >
                            BSCScan <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-bold text-[15px]" style={{ color: getAmountColor(tx.type) }}>
                      {tx.type === 'order' ? '−' : '+'}{formatPrice(Math.abs(Number(tx.displayAmount)))}
                    </p>
                    {tx.displayBalanceAfter != null && (
                      <p className="text-[11px] mt-0.5" style={{ color: '#bbb' }}>
                        Bal: {formatPrice(Number(tx.displayBalanceAfter))}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(22, 163, 74,.08)' }}>
                <WalletIcon className="h-6 w-6" style={{ color: '#16a34a' }} />
              </div>
              <p className="font-medium text-[14px]" style={{ color: '#666' }}>No transactions yet</p>
              <p className="text-[12px] mt-1" style={{ color: '#bbb' }}>Your deposits and spending history will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
