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
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4">
        <div className="relative w-full max-w-2xl text-center rounded-3xl p-10 md:p-14 overflow-hidden border border-border bg-card shadow-[0_10px_40px_-12px_rgba(0,0,0,0.08)]">
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-6 bg-muted">
              <WalletIcon className="h-8 w-8 text-muted-foreground" />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-foreground">
              Contact Admin to
              <br />
              Add Funds
            </h1>

            <p className="mt-5 text-[15px] md:text-base max-w-md mx-auto leading-relaxed text-muted-foreground">
              To add funds to your wallet, please contact the admin.
              You will receive assistance shortly.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

