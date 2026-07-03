import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send, IndianRupee, MessageCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const QUICK = [100, 500, 1000, 2000, 5000, 10000];

// Admin Telegram handle (without @)
const TG_USERNAME = 'Hkasdfgkl';

export default function ManualFundCard() {
  const [amount, setAmount] = useState<string>('500');

  const handleOpenTelegram = () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 100) {
      toast.error('Minimum ₹100');
      return;
    }
    if (amt > 540000) {
      toast.error('Maximum ₹5,40,000 per request');
      return;
    }

    const message =
      `Hi 👋, I want to add ₹${amt.toLocaleString('en-IN')} to my MultySMM wallet manually.\n\n` +
      `Amount: ₹${amt.toLocaleString('en-IN')}\n` +
      `Method: Manual Fund Add\n\n` +
      `Please share payment details. Thank you!`;

    const url = `https://t.me/${TG_USERNAME}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('Opening Telegram…');
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-7"
      style={{
        background: 'white',
        border: '1px solid #CFE9FF',
        boxShadow: '0 4px 24px -8px rgba(37,120,229,.15), 0 1px 2px rgba(15,23,42,.04)',
      }}
    >
      <div
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(37,120,229,.18), transparent 70%)' }}
      />
      <div
        className="absolute -bottom-20 -left-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(14,165,233,.14), transparent 70%)' }}
      />

      <div className="relative flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #229ED9, #0EA5E9)',
              boxShadow: '0 10px 22px -6px rgba(34,158,217,.5)',
            }}
          >
            <Send className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-[17px] font-extrabold tracking-tight" style={{ color: '#0B0B16' }}>
              Manual Fund Add
            </h2>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em] mt-0.5"
              style={{
                background: 'linear-gradient(135deg, #229ED9, #0EA5E9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              VIA TELEGRAM · ADMIN CHAT
            </p>
          </div>
        </div>
        <div
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{ background: '#E5F3FF', color: '#0369A1', border: '1px solid #CFE9FF' }}
        >
          <MessageCircle className="h-3 w-3" /> INSTANT CHAT
        </div>
      </div>

      <p className="relative text-[13px] leading-relaxed mb-6" style={{ color: '#7d6f97' }}>
        Enter amount and continue on Telegram — a pre-filled message opens in our admin chat for quick manual top-up.
      </p>

      <Label
        htmlFor="manual-amount"
        className="text-[11px] font-bold uppercase tracking-[0.14em]"
        style={{ color: '#7d6f97' }}
      >
        Enter Amount (INR)
      </Label>
      <div className="relative mt-2">
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg z-10"
          style={{ background: '#E5F3FF' }}
        >
          <IndianRupee className="h-3.5 w-3.5" style={{ color: '#229ED9' }} strokeWidth={2.5} />
        </div>
        <Input
          id="manual-amount"
          type="number"
          inputMode="decimal"
          min={100}
          max={540000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="500"
          className="pl-14 pr-4 h-14 text-2xl font-bold border-2 rounded-xl relative"
          style={{
            color: '#0B0B16',
            borderColor: '#CFE9FF',
            background: '#F4FAFF',
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
                background: active ? 'linear-gradient(135deg, #229ED9, #0EA5E9)' : 'white',
                color: active ? 'white' : '#4A4A5E',
                border: active ? '1px solid transparent' : '1.5px solid #CFE9FF',
                boxShadow: active ? '0 4px 12px -4px rgba(34,158,217,.45)' : 'none',
              }}
            >
              ₹{v >= 1000 ? `${v / 1000}k` : v}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleOpenTelegram}
        disabled={!amount}
        className="w-full mt-6 h-14 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #229ED9 0%, #0EA5E9 45%, #38BDF8 100%)',
          color: 'white',
          boxShadow: '0 14px 30px -10px rgba(34,158,217,.6), inset 0 1px 0 rgba(255,255,255,.25)',
          letterSpacing: '-0.01em',
        }}
      >
        <Send className="h-5 w-5" strokeWidth={2.5} />
        Add ₹{Number(amount || 0).toLocaleString('en-IN')} via Telegram
        <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        <ShieldCheck className="h-3 w-3" style={{ color: '#94a3b8' }} />
        <p className="text-[11px]" style={{ color: '#94a3b8' }}>
          Manual review by admin · Credited after payment confirmation
        </p>
      </div>
    </div>
  );
}
