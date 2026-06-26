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
        background: 'white',
        border: '1px solid #EDE4FE',
        boxShadow: '0 4px 24px -8px rgba(124,58,237,.12), 0 1px 2px rgba(15,23,42,.04)',
      }}
    >
      {/* accent orb */}
      <div
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(124,58,237,.16), transparent 70%)' }}
      />
      <div
        className="absolute -bottom-20 -left-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(236,72,153,.14), transparent 70%)' }}
      />

      <div className="relative flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', boxShadow: '0 10px 22px -6px rgba(124,58,237,.5)' }}
          >
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-[17px] font-extrabold tracking-tight" style={{ color: '#0B0B16' }}>
              Add Funds
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] mt-0.5"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Instant UPI · Auto-credit
            </p>
          </div>
        </div>
        <div
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{ background: '#F5EEFF', color: '#6D28D9', border: '1px solid #E5D7FA' }}
        >
          <ShieldCheck className="h-3 w-3" /> SECURE
        </div>
      </div>

      <p className="relative text-[13px] leading-relaxed mb-6" style={{ color: '#7d6f97' }}>
        Pay via UPI · GPay · PhonePe · Paytm — your wallet is credited instantly after payment.
      </p>

      <Label htmlFor="zap-amount" className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: '#7d6f97' }}>
        Enter Amount
      </Label>
      <div className="relative mt-2">
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg z-10"
          style={{ background: '#F5EEFF' }}
        >
          <IndianRupee className="h-3.5 w-3.5" style={{ color: '#7C3AED' }} strokeWidth={2.5} />
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
          className="pl-14 pr-4 h-14 text-2xl font-bold border-2 rounded-xl relative"
          style={{
            color: '#0B0B16',
            borderColor: '#EDE4FE',
            background: '#FBF8FF',
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
                background: active ? 'linear-gradient(135deg, #ff8a3d, #ea580c)' : 'white',
                color: active ? 'white' : '#475569',
                border: active ? '1px solid transparent' : '1.5px solid #e2e8f0',
                boxShadow: active ? '0 4px 12px -4px rgba(234,88,12,.45)' : 'none',
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
          background: 'linear-gradient(135deg, #ff8a3d 0%, #ea580c 50%, #c2410c 100%)',
          color: 'white',
          boxShadow: '0 10px 24px -8px rgba(234,88,12,.55), inset 0 1px 0 rgba(255,255,255,.25)',
          fontFamily: 'Sora, system-ui, sans-serif',
          letterSpacing: '-0.01em',
        }}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Redirecting to UPI…
          </>
        ) : (
          <>
            <Zap className="h-5 w-5" fill="white" strokeWidth={2.5} />
            Pay ₹{Number(amount || 0).toLocaleString('en-IN')} Now
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        <ShieldCheck className="h-3 w-3" style={{ color: '#94a3b8' }} />
        <p className="text-[11px]" style={{ color: '#94a3b8' }}>
          Auto-verified by server · No refresh needed
        </p>
      </div>

      {/* Support links hidden temporarily — will re-enable after subscription is taken */}
    </div>
  );
}