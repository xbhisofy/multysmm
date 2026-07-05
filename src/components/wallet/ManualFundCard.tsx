import { useState } from 'react';
import { toast } from 'sonner';
import { Send, IndianRupee, CheckCheck, Zap, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const QUICK = [100, 500, 1000, 2000, 5000, 10000];
const TG_USERNAME = 'Hkasdfgkl';
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 540000;

export default function ManualFundCard() {
  const [amount, setAmount] = useState<string>('500');
  const [focused, setFocused] = useState(false);
  const { user, profile } = useAuth();

  const handleOpenTelegram = () => {
    const amt = Number(amount);
    if (!amount || !Number.isFinite(amt)) return toast.error('Please enter an amount');
    if (amt < MIN_AMOUNT) return toast.error(`Minimum amount is ₹${MIN_AMOUNT}`);
    if (amt > MAX_AMOUNT) return toast.error(`Maximum amount is ₹${MAX_AMOUNT.toLocaleString('en-IN')}`);

    const username = profile?.full_name || (user?.email ? user.email.split('@')[0] : 'N/A');
    const email = user?.email || 'N/A';
    const userId = user?.id || 'N/A';

    const message =
      `Hello MultySMM Team,\n\n` +
      `I would like to manually add funds to my MultySMM wallet.\n\n` +
      `Requested Amount:\n₹${amt.toLocaleString('en-IN')}\n\n` +
      `Username:\n${username}\n\n` +
      `Email:\n${email}\n\n` +
      `User ID:\n${userId}\n\n` +
      `Please send me the payment details.\n\n` +
      `Thank you.`;

    window.open(`https://t.me/${TG_USERNAME}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    toast.success('Opening Telegram…');
  };

  const displayName = profile?.full_name || (user?.email ? user.email.split('@')[0] : 'you');

  return (
    <div
      className="relative overflow-hidden rounded-[28px] p-1"
      style={{
        background: 'linear-gradient(140deg, #0088CC 0%, #229ED9 40%, #38BDF8 100%)',
        boxShadow: '0 20px 50px -20px rgba(0,136,204,.55), 0 4px 12px -4px rgba(15,23,42,.1)',
      }}
    >
      {/* Inner surface — dark chat-app feel */}
      <div
        className="relative rounded-[24px] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #17212B 0%, #0E1621 100%)',
        }}
      >
        {/* Ambient glow blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(56,189,248,.28), transparent 70%)' }} />
        <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(0,136,204,.35), transparent 70%)' }} />

        {/* Telegram-style header bar */}
        <div
          className="relative flex items-center justify-between px-5 py-3.5"
          style={{
            background: 'linear-gradient(180deg, rgba(23,33,43,.85), rgba(23,33,43,.6))',
            borderBottom: '1px solid rgba(56,189,248,.12)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-[15px]"
                style={{ background: 'linear-gradient(135deg, #0088CC, #38BDF8)' }}
              >
                M
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ background: '#22c55e', borderColor: '#17212B' }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-[14px] truncate leading-tight">MultySMM Admin</p>
              <p className="text-[11px] font-medium flex items-center gap-1" style={{ color: '#7bb8dc' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#22c55e' }} />
                online · replies in minutes
              </p>
            </div>
          </div>
          <div
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{
              background: 'rgba(56,189,248,.14)',
              color: '#7dd3fc',
              border: '1px solid rgba(56,189,248,.3)',
            }}
          >
            <Zap className="h-3 w-3" /> MANUAL
          </div>
        </div>

        {/* Chat preview area */}
        <div className="relative px-5 pt-5 pb-3 space-y-2.5">
          {/* Admin message bubble */}
          <div className="flex items-end gap-2 max-w-[85%]">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #0088CC, #38BDF8)' }}
            >
              M
            </div>
            <div
              className="px-3.5 py-2 rounded-2xl rounded-bl-md text-[13px] leading-snug"
              style={{ background: '#182533', color: '#E7F3FB' }}
            >
              Hi {displayName} 👋 Send the amount you'd like to top up.
            </div>
          </div>

          {/* User message bubble (typing / preview) */}
          <div className="flex justify-end">
            <div
              className="px-3.5 py-2 rounded-2xl rounded-br-md text-[13px] leading-snug font-medium flex items-center gap-1.5"
              style={{
                background: 'linear-gradient(135deg, #2B5278, #1E3A5F)',
                color: 'white',
                boxShadow: '0 2px 8px -2px rgba(43,82,120,.5)',
              }}
            >
              Add ₹{Number(amount || 0).toLocaleString('en-IN')} please
              <CheckCheck className="h-3.5 w-3.5" style={{ color: '#7dd3fc' }} />
            </div>
          </div>
        </div>

        {/* Amount composer — Telegram-style input area */}
        <div
          className="relative mx-4 mb-4 mt-2 rounded-2xl p-4"
          style={{
            background: 'rgba(255,255,255,.03)',
            border: '1px solid rgba(255,255,255,.08)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2.5" style={{ color: '#7bb8dc' }}>
            Amount to top up
          </p>

          {/* Big amount display */}
          <div
            className="relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
            style={{
              background: '#0E1621',
              border: `1.5px solid ${focused ? '#38BDF8' : 'rgba(56,189,248,.2)'}`,
              boxShadow: focused ? '0 0 0 4px rgba(56,189,248,.15)' : 'none',
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(0,136,204,.25), rgba(56,189,248,.15))' }}
            >
              <IndianRupee className="h-4 w-4" style={{ color: '#38BDF8' }} strokeWidth={2.5} />
            </div>
            <input
              type="number"
              inputMode="decimal"
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="500"
              className="flex-1 bg-transparent border-0 outline-none text-white text-2xl sm:text-[26px] font-bold tracking-tight placeholder:text-white/25"
            />
            <span className="text-[11px] font-semibold uppercase tracking-wider hidden sm:inline" style={{ color: '#5a8ab0' }}>
              INR
            </span>
          </div>

          {/* Quick chips — 3 cols on mobile, 6 on sm+ */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-3">
            {QUICK.map((v) => {
              const active = amount === String(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className="py-2 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, #0088CC, #38BDF8)'
                      : 'rgba(255,255,255,.04)',
                    color: active ? 'white' : '#a8cce0',
                    border: active ? '1px solid transparent' : '1px solid rgba(56,189,248,.15)',
                    boxShadow: active ? '0 4px 12px -3px rgba(0,136,204,.5)' : 'none',
                  }}
                >
                  ₹{v >= 1000 ? `${v / 1000}k` : v}
                </button>
              );
            })}
          </div>
        </div>

        {/* Send button — mimics Telegram send action */}
        <div className="px-4 pb-4">
          <button
            onClick={handleOpenTelegram}
            disabled={!amount}
            className="group relative w-full h-[54px] rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 overflow-hidden transition-all active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #0088CC 0%, #229ED9 50%, #38BDF8 100%)',
              color: 'white',
              boxShadow: '0 12px 28px -8px rgba(0,136,204,.65), inset 0 1px 0 rgba(255,255,255,.3)',
              letterSpacing: '-0.01em',
            }}
          >
            {/* shimmer sweep */}
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,.25) 50%, transparent 70%)',
                animation: 'shimmer 1.4s linear infinite',
              }}
            />
            <Send className="h-5 w-5 relative" strokeWidth={2.5} />
            <span className="relative">Send Request on Telegram</span>
          </button>

          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex -space-x-1.5">
              <div className="w-4 h-4 rounded-full border-2" style={{ background: '#22c55e', borderColor: '#0E1621' }} />
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ background: '#0088CC', borderColor: '#0E1621' }}>
                <UserIcon className="h-2 w-2 text-white" strokeWidth={3} />
              </div>
            </div>
            <p className="text-[11px] font-medium" style={{ color: '#5a8ab0' }}>
              Message pre-filled · Admin credits after payment
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>
    </div>
  );
}
