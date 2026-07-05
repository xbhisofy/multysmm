import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Explicit columns — smaller payload, no leak of internal fields.
const WALLET_COLUMNS = 'id, user_id, balance, total_deposited, total_spent, updated_at';

export function useWallet() {
  const { user } = useAuth();

  const { data: wallet, isLoading, error } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select(WALLET_COLUMNS)
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  return { wallet, isLoading, error };
}
