import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bitcoin } from 'lucide-react';
import { SimpleCard, AmountBlock, ChipRow, PayCta } from './ZapUpiDepositCard';

const QUICK = [90, 500, 1000, 2000, 5000, 10000];
const ACCENT = '#F7931A';

export default function OxaPayAddFunds() {
  const [amount, setAmount] = useState<string>('100');
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
      if (error) throw new Error(error.message);
      const payUrl = (data as any)?.payment_url;
      if (!payUrl) throw new Error('Gateway did not return a payment URL');
      window.location.href = payUrl;
    } catch (e: any) {
      toast.error(e?.message || 'Could not start crypto payment');
      setLoading(false);
    }
  };

  return (
    <SimpleCard
      accent={ACCENT}
      tag="CRYPTO"
      title="Pay with Crypto"
      subtitle="USDT · BTC · TRX · LTC · ETH"
      icon={<Bitcoin className="h-4 w-4" strokeWidth={2.5} />}
    >
      <AmountBlock value={amount} onChange={setAmount} min={90} max={540000} accent={ACCENT} id="oxapay-amount" />
      <ChipRow values={QUICK} value={amount} onPick={setAmount} accent={ACCENT} />
      <PayCta
        accent={ACCENT}
        onClick={handlePay}
        loading={loading}
        label={`Pay ₹${Number(amount || 0).toLocaleString('en-IN')} in Crypto`}
        loadingLabel="Opening OxaPay…"
      />
      <p className="mt-3 text-[11px] text-center text-slate-400">Rate ₹90 = $1 · webhook auto-credit</p>
    </SimpleCard>
  );
}
