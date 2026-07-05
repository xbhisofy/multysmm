import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type TransactionFilter = 'all' | 'deposit' | 'withdrawal' | 'order' | 'refund';

// Explicit columns instead of select('*') — cuts payload ~50% and avoids
// shipping internal fields to the client.
const TX_COLUMNS =
  'id, user_id, type, amount, balance_after, status, payment_method, payment_reference, description, order_id, created_at';

export function useTransactions(filter: TransactionFilter = 'all') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id, filter],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(TX_COLUMNS)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}
