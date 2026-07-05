import { useState } from 'react';
import { toast } from 'sonner';
import { Send, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  TicketCard, TicketHeader, AmountField, QuickChips, PayButton, FootNote,
} from './ZapUpiDepositCard';

const QUICK = [100, 500, 1000, 2000, 5000, 10000];
const TG_USERNAME = 'Hkasdfgkl';
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 540000;
const ACCENT = '#0088CC';
const ACCENT_SOFT = '#E3F2FD';

export default function ManualFundCard() {
  const [amount, setAmount] = useState<string>('500');
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
    <TicketCard accent={ACCENT} accentSoft={ACCENT_SOFT} tag="MANUAL · TELEGRAM" method="ADMIN CREDITS AFTER PAYMENT">
      <TicketHeader
        accent={ACCENT}
        icon={<MessageCircle className="h-5 w-5" fill="white" strokeWidth={2.5} />}
        title="TALK TO ADMIN"
        subtitle="For custom / bulk top-ups"
        badge="LIVE"
      />

      <div className="px-5 sm:px-6 pt-5 pb-6">
        <AmountField
          id="manual-amount"
          value={amount}
          onChange={setAmount}
          min={MIN_AMOUNT}
          max={MAX_AMOUNT}
          accent={ACCENT}
          accentSoft={ACCENT_SOFT}
        />

        <QuickChips values={QUICK} value={amount} onPick={setAmount} accent={ACCENT} cols={6} />

        <PayButton
          accent={ACCENT}
          gradient={`linear-gradient(135deg, ${ACCENT} 0%, #229ED9 50%, #38BDF8 100%)`}
          onClick={handleOpenTelegram}
          loading={false}
          disabled={!amount}
          loadingLabel=""
          label="Open Telegram"
          icon={<Send className="h-5 w-5" strokeWidth={2.5} />}
        />

        <FootNote text="Message pre-filled · Admin replies in minutes" />
      </div>
    </TicketCard>
  );
}
