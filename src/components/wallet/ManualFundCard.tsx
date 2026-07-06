import { useState } from 'react';
import { toast } from 'sonner';
import { Send, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SimpleCard, AmountBlock, ChipRow, PayCta } from './ZapUpiDepositCard';

const QUICK = [100, 500, 1000, 2000, 5000, 10000];
const TG_USERNAME = 'multysmm';
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 540000;
const ACCENT = '#0088CC';

export default function ManualFundCard() {
  const [amount, setAmount] = useState<string>('100');
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

  return (
    <SimpleCard
      accent={ACCENT}
      tag="MANUAL"
      title="Talk to Admin"
      subtitle={
        <span>
          Custom / bulk top-ups on Telegram{' '}
          <a
            href={`https://t.me/${TG_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline font-semibold"
            style={{ color: ACCENT }}
          >
            @{TG_USERNAME}
          </a>
        </span>
      }
      icon={<MessageCircle className="h-4 w-4" fill="white" strokeWidth={0} />}
    >
      <AmountBlock value={amount} onChange={setAmount} min={MIN_AMOUNT} max={MAX_AMOUNT} accent={ACCENT} id="manual-amount" />
      <ChipRow values={QUICK} value={amount} onPick={setAmount} accent={ACCENT} />
      <PayCta
        accent={ACCENT}
        onClick={handleOpenTelegram}
        loading={false}
        label="Open Telegram"
        loadingLabel=""
      />
      <p className="mt-3 text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
        <Send className="h-3 w-3" /> Message pre-filled · replies in minutes
      </p>
    </SimpleCard>
  );
}
