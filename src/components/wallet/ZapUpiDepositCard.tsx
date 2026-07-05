import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Zap, IndianRupee, ArrowUpRight } from 'lucide-react';

const QUICK = [100, 500, 1000, 2000, 5000];
const ACCENT = '#7C3AED';

export default function ZapUpiDepositCard() {
  const [amount, setAmount] = useState<string>('500');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapupi-create-order`;
        await fetch(url, { method: 'OPTIONS', mode: 'cors' });
      } catch {}
    })();
  }, []);

  const PROD_ORIGIN = 'https://multysmm.com';
  const openPage = (u: string) => {
    try { if (window.top && window.top !== window.self) { window.top.location.href = u; return; } } catch {}
    window.location.href = u;
  };

  const handlePay = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 50) return toast.error('Minimum ₹50');
    if (amt > 100000) return toast.error('Maximum ₹1,00,000 per transaction');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('zapupi-create-order', {
        body: { amount_inr: amt, origin: PROD_ORIGIN, return_url: `${PROD_ORIGIN}/wallet` },
      });
      if (error) throw new Error(error.message);
      const payUrl = (data as any)?.payment_url;
      if (!payUrl) throw new Error('Gateway did not return a payment URL');
      openPage(payUrl);
    } catch (e: any) {
      toast.error(e?.message || 'Could not start payment');
      setLoading(false);
    }
  };

  return (
    <SimpleCard
      accent={ACCENT}
      tag="UPI"
      title="Instant UPI"
      subtitle="GPay · PhonePe · Paytm"
      icon={<Zap className="h-4 w-4" fill="currentColor" strokeWidth={0} />}
    >
      <AmountBlock value={amount} onChange={setAmount} min={50} max={100000} accent={ACCENT} id="zap-amount" />
      <ChipRow values={QUICK} value={amount} onPick={setAmount} accent={ACCENT} />
      <PayCta
        accent={ACCENT}
        onClick={handlePay}
        loading={loading}
        label={`Pay ₹${Number(amount || 0).toLocaleString('en-IN')}`}
        loadingLabel="Redirecting…"
      />
      <p className="mt-3 text-[11px] text-center text-slate-400">Auto-credit after payment · no refresh</p>
    </SimpleCard>
  );
}

/* ---------- Shared minimal primitives ---------- */

export function SimpleCard({
  accent, tag, title, subtitle, icon, children,
}: {
  accent: string; tag: string; title: string; subtitle: React.ReactNode;
  icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-2xl bg-white overflow-hidden"
      style={{ border: '1px solid #EEF0F4', boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px -12px rgba(15,23,42,.08)' }}
    >
      {/* thin accent bar on the left */}
      <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full" style={{ background: accent }} />

      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ background: accent }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-slate-900 leading-tight tracking-tight truncate">
                {title}
              </h2>
              <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">{subtitle}</p>
            </div>
          </div>
          <span
            className="shrink-0 text-[10px] font-semibold tracking-[0.14em] px-2 py-1 rounded-md"
            style={{ background: `${accent}12`, color: accent }}
          >
            {tag}
          </span>
        </div>

        {children}
      </div>
    </div>
  );
}

export function AmountBlock({
  id, value, onChange, min, max, accent,
}: { id: string; value: string; onChange: (v: string) => void; min: number; max: number; accent: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="rounded-xl px-4 py-3.5 transition-all"
      style={{
        background: '#FAFBFC',
        border: `1px solid ${focused ? accent : '#EEF0F4'}`,
        boxShadow: focused ? `0 0 0 4px ${accent}18` : 'none',
      }}
    >
      <label htmlFor={id} className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Amount
      </label>
      <div className="flex items-center gap-2 mt-1">
        <IndianRupee className="h-5 w-5 text-slate-400" strokeWidth={2.5} />
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="500"
          className="flex-1 bg-transparent border-0 outline-none text-slate-900 text-[26px] font-semibold tracking-tight placeholder:text-slate-300"
        />
        <span className="text-[10.5px] font-medium text-slate-400 tracking-wider">
          ₹{min}–{max >= 100000 ? `${Math.round(max / 1000)}k` : max.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}

export function ChipRow({
  values, value, onPick, accent,
}: { values: number[]; value: string; onPick: (v: string) => void; accent: string }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {values.map((v) => {
        const active = value === String(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => onPick(String(v))}
            className="flex-1 min-w-[52px] py-2 rounded-lg text-[12px] font-semibold transition-all active:scale-95"
            style={{
              background: active ? accent : 'white',
              color: active ? 'white' : '#475569',
              border: `1px solid ${active ? accent : '#EEF0F4'}`,
            }}
          >
            ₹{v >= 1000 ? `${v / 1000}k` : v}
          </button>
        );
      })}
    </div>
  );
}

export function PayCta({
  accent, onClick, loading, label, loadingLabel,
}: { accent: string; onClick: () => void; loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full mt-4 h-12 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[.99] disabled:opacity-60"
      style={{ background: accent, boxShadow: `0 8px 20px -8px ${accent}80` }}
    >
      {loading ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> {loadingLabel}</>
      ) : (
        <>{label} <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} /></>
      )}
    </button>
  );
}
