import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bitcoin } from 'lucide-react';
import {
  TicketCard, TicketHeader, AmountField, QuickChips, PayButton, FootNote,
} from './ZapUpiDepositCard';

const QUICK = [90, 500, 1000, 2000, 5000, 10000];
const ACCENT = '#F7931A';
const ACCENT_SOFT = '#FFF3E0';

export default function OxaPayAddFunds() {
  const [amount, setAmount] = useState<string>('500');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 90) return toast.error('Minimum ₹90');
    if (amt > 540000) return toast.error('Maximum ₹5,40,000 per transaction');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('oxapay-create-invoice', {
        body: { amount_inr: amt, return_origin: window.location.origin },
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
    <TicketCard accent={ACCENT} accentSoft={ACCENT_SOFT} tag="CRYPTO · AUTO" method="USDT · BTC · TRX · LTC · ETH">
      <TicketHeader
        accent={ACCENT}
        icon={<Bitcoin className="h-5 w-5" strokeWidth={2.5} />}
        title="CRYPTO TOP-UP"
        subtitle="Rate: ₹90 = $1 · webhook auto-credit"
        badge="AUTO"
      />

      <div className="px-5 sm:px-6 pt-5 pb-6">
        <AmountField
          id="oxapay-amount"
          value={amount}
          onChange={setAmount}
          min={90}
          max={540000}
          accent={ACCENT}
          accentSoft={ACCENT_SOFT}
        />

        <QuickChips values={QUICK} value={amount} onPick={setAmount} accent={ACCENT} cols={6} />

        <PayButton
          accent={ACCENT}
          gradient={`linear-gradient(135deg, ${ACCENT} 0%, #FB923C 50%, #FBBF24 100%)`}
          onClick={handlePay}
          loading={loading}
          disabled={!amount}
          loadingLabel="Opening OxaPay…"
          label={`Pay ₹${Number(amount || 0).toLocaleString('en-IN')} in Crypto`}
          icon={<Bitcoin className="h-5 w-5" strokeWidth={2.5} />}
        />

        <FootNote text="Auto-verified via webhook · No manual approval" />
      </div>
    </TicketCard>
  );
}
