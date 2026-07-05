import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Zap, IndianRupee, ArrowRight, ShieldCheck } from 'lucide-react';

const QUICK = [100, 500, 1000, 2000, 5000];
const ACCENT = '#7C3AED';
const ACCENT_SOFT = '#F3ECFF';

export default function ZapUpiDepositCard() {
  const [amount, setAmount] = useState<string>('500');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const warm = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapupi-create-order`;
        await fetch(url, { method: 'OPTIONS', mode: 'cors' });
      } catch {}
    };
    warm();
  }, []);

  const PROD_ORIGIN = 'https://multysmm.com';
  const buildReturnUrl = () => `${PROD_ORIGIN}/wallet`;

  const openPaymentPage = (payUrl: string) => {
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = payUrl;
        return;
      }
    } catch {}
    window.location.href = payUrl;
  };

  const handlePay = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 50) return toast.error('Minimum ₹50');
    if (amt > 100000) return toast.error('Maximum ₹1,00,000 per transaction');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('zapupi-create-order', {
        body: { amount_inr: amt, origin: PROD_ORIGIN, return_url: buildReturnUrl() },
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
    <TicketCard accent={ACCENT} accentSoft={ACCENT_SOFT} tag="INSTANT UPI" method="UPI · GPAY · PHONEPE · PAYTM">
      <TicketHeader
        accent={ACCENT}
        icon={<Zap className="h-5 w-5" fill="white" strokeWidth={2.5} />}
        title="UPI TOP-UP"
        subtitle="Auto-credit in seconds"
        badge="SECURE"
      />

      <div className="px-5 sm:px-6 pt-5 pb-6">
        <AmountField
          id="zap-amount"
          value={amount}
          onChange={setAmount}
          min={50}
          max={100000}
          accent={ACCENT}
          accentSoft={ACCENT_SOFT}
        />

        <QuickChips values={QUICK} value={amount} onPick={setAmount} accent={ACCENT} cols={5} />

        <PayButton
          accent={ACCENT}
          gradient={`linear-gradient(135deg, ${ACCENT} 0%, #A855F7 55%, #EC4899 100%)`}
          onClick={handlePay}
          loading={loading}
          disabled={!amount}
          loadingLabel="Redirecting to UPI…"
          label={`Pay ₹${Number(amount || 0).toLocaleString('en-IN')} Now`}
          icon={<Zap className="h-5 w-5" fill="white" strokeWidth={2.5} />}
        />

        <FootNote text="Auto-verified by server · No refresh needed" />
      </div>
    </TicketCard>
  );
}

/* ---------- Shared ticket primitives (used by all 3 cards) ---------- */

export function TicketCard({
  accent, accentSoft, tag, method, children,
}: { accent: string; accentSoft: string; tag: string; method: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* hard offset shadow layer */}
      <div
        className="absolute inset-0 rounded-[22px] translate-x-[5px] translate-y-[5px] sm:translate-x-[6px] sm:translate-y-[6px]"
        style={{ background: '#0B0B16' }}
      />
      <div
        className="relative rounded-[22px] overflow-hidden bg-white"
        style={{ border: '2.5px solid #0B0B16' }}
      >
        {/* top ticket meta strip */}
        <div
          className="flex items-center justify-between px-4 sm:px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em]"
          style={{ background: accentSoft, color: '#0B0B16', borderBottom: '2px dashed #0B0B16' }}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
            {tag}
          </span>
          <span className="truncate max-w-[55%] text-right opacity-70">{method}</span>
        </div>

        {children}

        {/* perforation footer */}
        <div className="relative h-3" style={{ background: '#0B0B16' }}>
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0"
            style={{
              backgroundImage: 'radial-gradient(circle, white 3px, transparent 3.5px)',
              backgroundSize: '14px 6px',
              backgroundRepeat: 'repeat-x',
              height: '6px',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function TicketHeader({
  accent, icon, title, subtitle, badge,
}: { accent: string; icon: React.ReactNode; title: string; subtitle: string; badge: string }) {
  return (
    <div
      className="relative flex items-center justify-between gap-3 px-5 sm:px-6 py-5"
      style={{ borderBottom: '2px solid #0B0B16', background: 'white' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white"
          style={{ background: accent, border: '2.5px solid #0B0B16', boxShadow: '3px 3px 0 #0B0B16' }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-[18px] sm:text-[19px] font-black tracking-tight leading-tight" style={{ color: '#0B0B16' }}>
            {title}
          </h2>
          <p className="text-[12px] font-semibold mt-0.5" style={{ color: '#5a5a72' }}>
            {subtitle}
          </p>
        </div>
      </div>
      <div
        className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider"
        style={{ background: '#0B0B16', color: 'white' }}
      >
        <ShieldCheck className="h-3 w-3" /> {badge}
      </div>
    </div>
  );
}

export function AmountField({
  id, value, onChange, min, max, accent, accentSoft,
}: { id: string; value: string; onChange: (v: string) => void; min: number; max: number; accent: string; accentSoft: string }) {
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={id} className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: '#0B0B16' }}>
          Enter Amount
        </label>
        <span className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>
          MIN ₹{min} · MAX ₹{max.toLocaleString('en-IN')}
        </span>
      </div>
      <div
        className="relative flex items-center rounded-xl overflow-hidden"
        style={{ border: '2px solid #0B0B16', background: accentSoft }}
      >
        <div
          className="w-12 h-14 flex items-center justify-center shrink-0"
          style={{ background: accent, borderRight: '2px solid #0B0B16' }}
        >
          <IndianRupee className="h-4.5 w-4.5 text-white" strokeWidth={3} />
        </div>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="500"
          className="flex-1 h-14 bg-transparent border-0 outline-none px-4 text-2xl font-black tracking-tight"
          style={{ color: '#0B0B16' }}
        />
      </div>
    </>
  );
}

export function QuickChips({
  values, value, onPick, accent, cols,
}: { values: number[]; value: string; onPick: (v: string) => void; accent: string; cols: 5 | 6 }) {
  return (
    <div className={`grid gap-1.5 mt-3 ${cols === 6 ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-5'}`}>
      {values.map((v) => {
        const active = value === String(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => onPick(String(v))}
            className="py-2.5 rounded-lg text-[12px] font-black transition-all active:translate-y-[1px]"
            style={{
              background: active ? '#0B0B16' : 'white',
              color: active ? 'white' : '#0B0B16',
              border: '2px solid #0B0B16',
              boxShadow: active ? `inset 0 0 0 2px ${accent}` : '2px 2px 0 #0B0B16',
            }}
          >
            ₹{v >= 1000 ? `${v / 1000}k` : v}
          </button>
        );
      })}
    </div>
  );
}

export function PayButton({
  accent, gradient, onClick, loading, disabled, loadingLabel, label, icon,
}: {
  accent: string; gradient: string; onClick: () => void; loading: boolean; disabled: boolean;
  loadingLabel: string; label: string; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="group relative w-full mt-5 h-[56px] rounded-xl font-black text-[15px] flex items-center justify-center gap-2 overflow-hidden transition-all active:translate-y-[2px] disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: gradient,
        color: 'white',
        border: '2.5px solid #0B0B16',
        boxShadow: '4px 4px 0 #0B0B16',
        letterSpacing: '0.01em',
      }}
    >
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%)',
          animation: 'ticket-shimmer 1.4s linear infinite',
        }}
      />
      {loading ? (
        <><Loader2 className="h-5 w-5 animate-spin relative" /> <span className="relative">{loadingLabel}</span></>
      ) : (
        <>
          <span className="relative">{icon}</span>
          <span className="relative uppercase tracking-wide">{label}</span>
          <ArrowRight className="h-5 w-5 relative" strokeWidth={3} />
        </>
      )}
      <style>{`@keyframes ticket-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
      <span className="sr-only">{accent}</span>
    </button>
  );
}

export function FootNote({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mt-4">
      <ShieldCheck className="h-3 w-3" style={{ color: '#94a3b8' }} />
      <p className="text-[11px] font-semibold" style={{ color: '#94a3b8' }}>{text}</p>
    </div>
  );
}
