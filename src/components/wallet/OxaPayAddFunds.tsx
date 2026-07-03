import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Bitcoin, IndianRupee, ShieldCheck, ArrowRight } from 'lucide-react';

const QUICK = [90, 500, 1000, 2000, 5000, 10000];

export default function OxaPayAddFunds() {
  const [amount, setAmount] = useState<string>('500');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 90) {
      toast.error('Minimum ₹90');
      return;
    }
    if (amt > 540000) {
      toast.error('Maximum ₹5,40,000 per transaction');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('oxapay-create-invoice', {
        body: {
          amount_inr: amt,
          return_origin: window.location.origin,
        },
      });
      if (error) throw new Error(error.message || 'Failed to create invoice');
      const payUrl = (data as any)?.payment_url;
      if (!payUrl) throw new Error('Gateway did not return a payment URL');
      window.location.href = payUrl;
    } catch (e: any) {
      toast.error(e?.message || 'Could not start crypto payment');
      setLoading(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-7"
      style={{
        background: 'white',
        border: '1px solid #FFE4C7',
        boxShadow: '0 4px 24px -8px rgba(247,147,26,.15), 0 1px 2px rgba(15,23,42,.04)',
      }}
    >
      <div
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(247,147,26,.18), transparent 70%)' }}
      />
      <div
        className="absolute -bottom-20 -left-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(34,197,94,.14), transparent 70%)' }}
      />

      <div className="relative flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F7931A, #FBBF24)', boxShadow: '0 10px 22px -6px rgba(247,147,26,.5)' }}
          >
            <Bitcoin className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-[17px] font-extrabold tracking-tight" style={{ color: '#0B0B16' }}>
              Pay with Crypto
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] mt-0.5"
              style={{ background: 'linear-gradient(135deg, #F7931A, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              USDT · BTC · TRX · LTC · ETH
            </p>
          </div>
        </div>
        <div
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{ background: '#FFF4E5', color: '#B45309', border: '1px solid #FFE4C7' }}
        >
          <ShieldCheck className="h-3 w-3" /> AUTO-CREDIT
        </div>
      </div>

      <p className="relative text-[13px] leading-relaxed mb-6" style={{ color: '#7d6f97' }}>
        Pay via OxaPay in any crypto — wallet auto-credits after network confirmation. Rate: ₹90 = $1.
      </p>

      <Label htmlFor="oxapay-amount" className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: '#7d6f97' }}>
        Enter Amount (INR)
      </Label>
      <div className="relative mt-2">
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg z-10"
          style={{ background: '#FFF4E5' }}
        >
          <IndianRupee className="h-3.5 w-3.5" style={{ color: '#F7931A' }} strokeWidth={2.5} />
        </div>
        <Input
          id="oxapay-amount"
          type="number"
          inputMode="decimal"
          min={90}
          max={540000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="500"
          className="pl-14 pr-4 h-14 text-2xl font-bold border-2 rounded-xl relative"
          style={{
            color: '#0B0B16',
            borderColor: '#FFE4C7',
            background: '#FFFBF4',
          }}
        />
      </div>

      <div className="grid grid-cols-6 gap-2 mt-3">
        {QUICK.map((v) => {
          const active = amount === String(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(String(v))}
              className="py-2.5 rounded-xl text-[11px] font-bold transition-all active:scale-95"
              style={{
                background: active ? 'linear-gradient(135deg, #F7931A, #FBBF24)' : 'white',
                color: active ? 'white' : '#4A4A5E',
                border: active ? '1px solid transparent' : '1.5px solid #FFE4C7',
                boxShadow: active ? '0 4px 12px -4px rgba(247,147,26,.45)' : 'none',
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
          background: 'linear-gradient(135deg, #F7931A 0%, #FB923C 45%, #FBBF24 100%)',
          color: 'white',
          boxShadow: '0 14px 30px -10px rgba(247,147,26,.6), inset 0 1px 0 rgba(255,255,255,.25)',
          letterSpacing: '-0.01em',
        }}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Opening OxaPay…
          </>
        ) : (
          <>
            <Bitcoin className="h-5 w-5" strokeWidth={2.5} />
            Pay ₹{Number(amount || 0).toLocaleString('en-IN')} in Crypto
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        <ShieldCheck className="h-3 w-3" style={{ color: '#94a3b8' }} />
        <p className="text-[11px]" style={{ color: '#94a3b8' }}>
          Auto-verified via webhook · No manual approval
        </p>
      </div>
    </div>
  );
}
