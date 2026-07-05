import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type TransactionFilter = 'all' | 'deposit' | 'withdrawal' | 'order' | 'refund';

// Explicit columns instead of select('*') — cuts payload ~50% and avoids
// shipping internal fields to the client.
const TX_COLUMNS =
  'id, user_id, type, amount, balance_after, status, payment_method, payment_reference, description, order_id, created_at';

export interface TransactionsOptions {
  from?: string; // ISO
  to?: string; // ISO
  limit?: number;
}

export function useTransactions(filter: TransactionFilter = 'all', opts: TransactionsOptions = {}) {
  const { user } = useAuth();
  const { from, to, limit = 100 } = opts;

  return useQuery({
    queryKey: ['transactions', user?.id, filter, from ?? null, to ?? null, limit],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(TX_COLUMNS)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filter !== 'all') query = query.eq('type', filter);
      if (from) query = query.gte('created_at', from);
      if (to) query = query.lt('created_at', to);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

// Lightweight aggregation query — fetches only amount/type/status for a range,
// no pagination. Client sums to compute Deposit / Spent / Refunded / Count.
export function useWalletSummary(from?: string, to?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wallet-summary', user?.id, from ?? null, to ?? null],
    queryFn: async () => {
      let q = supabase
        .from('transactions')
        .select('amount, type, status')
        .eq('user_id', user!.id)
        .limit(5000);
      if (from) q = q.gte('created_at', from);
      if (to) q = q.lt('created_at', to);
      const { data, error } = await q;
      if (error) throw error;

      let deposit = 0;
      let spent = 0;
      let refund = 0;
      let count = 0;
      for (const r of data ?? []) {
        const amt = Number(r.amount || 0);
        count++;
        if (r.type === 'deposit' && r.status === 'completed') deposit += amt;
        else if ((r.type === 'order' || r.type === 'order_payment') && r.status === 'completed')
          spent += Math.abs(amt);
        else if (r.type === 'refund' && r.status === 'completed') refund += Math.abs(amt);
      }
      return { deposit, spent, refund, count };
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}
