import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Zap, IndianRupee, ShieldCheck, ArrowRight, Send, MessageCircle, Lock } from 'lucide-react';

const QUICK = [100, 500, 1000, 2000, 5000];

export default function ZapUpiDepositCard() {
  const [amount, setAmount] = useState<string>('500');
  const [loading, setLoading] = useState(false);

  // Warm up the edge function on mount so the cold start doesn't happen on Pay click.
  useEffect(() => {
    let cancelled = false;
    const warm = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapupi-create-order`;
        await fetch(url, { method: 'OPTIONS', mode: 'cors' });
      } catch { /* ignore */ }
    };
    warm();
    return () => { cancelled = true; void cancelled; };
  }, []);

  const buildReturnUrl = () => {
    const current = new URL(window.location.href);
    const returnUrl = new URL('/wallet', window.location.origin);

    current.searchParams.forEach((value, key) => {
      if (key.startsWith('__lovable_')) {
        returnUrl.searchParams.set(key, value);
      }
    });

    return returnUrl.toString();
  };

  const openPaymentPage = (payUrl: string) => {
    const isEmbedded = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    try {
      if (isEmbedded) {
        const opened = window.open(payUrl, '_blank');
        if (opened) {
          opened.opener = null;
          setLoading(false);
          toast.info('Payment opened in a secure tab. Complete it to return to wallet.');
          return;
        }
      }

      if (window.top && window.top !== window) {
        window.top.location.href = payUrl;
        return;
      }
    } catch {
      // If iframe top navigation is blocked, fall back to same-frame navigation.
    }
    window.location.href = payUrl;
  };

  const handlePay = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 50) {
      toast.error('Minimum ₹50');
      return;
    }
    if (amt > 100000) {
      toast.error('Maximum ₹1,00,000 per transaction');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('zapupi-create-order', {
        body: {
          amount_inr: amt,
          origin: window.location.origin,
          return_url: buildReturnUrl(),
        },
      });
      if (error) throw new Error(error.message || 'Failed to create order');
      const payUrl = (data as any)?.payment_url;
      if (!payUrl) throw new Error('Gateway did not return a payment URL');
      openPaymentPage(payUrl);
    } catch (e: any) {
      toast.error(e?.message || 'Could not start payment');
      setLoading(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-7"
      style={{
        background: 'radial-gradient(120% 120% at 100% 0%, #1c1a13 0%, #141414 60%), #141414',
        border: '1px solid rgba(201,168,76,.22)',
        boxShadow: '0 20px 50px -18px rgba(201,168,76,.28), inset 0 1px 0 rgba(255,255,255,.03)',
      }}
    >
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(201,168,76,.20), transparent 70%)' }} />
      <div className="absolute -bottom-20 -left-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(240,215,140,.12), transparent 70%)' }} />
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,.5), transparent)' }} />

      <div className="relative flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f0d78c, #c9a84c 60%, #8b6f24)', boxShadow: '0 12px 24px -8px rgba(201,168,76,.55)' }}>
            <Zap className="h-5 w-5" style={{ color: '#0a0a0a' }} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl tracking-tight" style={{ color: '#efe7d4', fontFamily: "'Instrument Serif', serif" }}>
              Add <em style={{ color: '#f0d78c' }}>funds</em>
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.20em] mt-0.5" style={{ color: '#c9a84c' }}>
              Instant UPI · Auto-credit
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{ background: 'rgba(201,168,76,.10)', color: '#f0d78c', border: '1px solid rgba(201,168,76,.25)' }}>
          <ShieldCheck className="h-3 w-3" /> SECURE
        </div>
      </div>

      <p className="relative text-[13px] leading-relaxed mb-6" style={{ color: 'rgba(239,231,212,.6)' }}>
        Pay via UPI · GPay · PhonePe · Paytm — your wallet is credited instantly after payment.
      </p>

      <Label htmlFor="zap-amount" className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#c9a84c' }}>
        Enter Amount
      </Label>
      <div className="relative mt-2">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg z-10"
          style={{ background: 'rgba(201,168,76,.14)', border: '1px solid rgba(201,168,76,.25)' }}>
          <IndianRupee className="h-3.5 w-3.5" style={{ color: '#f0d78c' }} strokeWidth={2.5} />
        </div>
        <Input
          id="zap-amount"
          type="number"
          inputMode="decimal"
          min={50}
          max={100000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="500"
          className="pl-14 pr-4 h-14 text-3xl rounded-xl relative"
          style={{
            color: '#efe7d4',
            border: '1px solid rgba(201,168,76,.25)',
            background: '#0a0a0a',
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
          }}
        />
      </div>

      <div className="grid grid-cols-5 gap-2 mt-3">
        {QUICK.map((v) => {
          const active = amount === String(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(String(v))}
              className="py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-95"
              style={{
                background: active ? 'linear-gradient(135deg, #f0d78c, #c9a84c)' : '#0a0a0a',
                color: active ? '#0a0a0a' : 'rgba(239,231,212,.7)',
                border: active ? '1px solid transparent' : '1px solid rgba(201,168,76,.18)',
                boxShadow: active ? '0 6px 16px -4px rgba(201,168,76,.45)' : 'none',
              }}
            >
              ₹{v >= 1000 ? `${v / 1000}k` : v}
            </button>
          );
        })}
      </div>

      <button
        onClick={handlePay}
        disabled={loading || !amount}
        className="w-full mt-6 h-14 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #f0d78c 0%, #c9a84c 50%, #8b6f24 100%)',
          color: '#0a0a0a',
          boxShadow: '0 18px 40px -12px rgba(201,168,76,.6), inset 0 1px 0 rgba(255,255,255,.30)',
          letterSpacing: '-0.01em',
        }}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Redirecting to UPI…
          </>
        ) : (
          <>
            <Zap className="h-5 w-5" fill="currentColor" strokeWidth={2.5} />
            Pay ₹{Number(amount || 0).toLocaleString('en-IN')} Now
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        <ShieldCheck className="h-3 w-3" style={{ color: 'rgba(201,168,76,.6)' }} />
        <p className="text-[11px]" style={{ color: 'rgba(239,231,212,.45)' }}>
          Auto-verified by server · No refresh needed
        </p>
      </div>
    </div>
  );
}

