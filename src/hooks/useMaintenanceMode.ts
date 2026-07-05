import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Poll maintenance mode every 60s. Realtime channel removed — at 100k
 * concurrent users, that was 100k WebSocket subscriptions to a single row.
 * A 60s poll on a cached RPC is cheap and enough for a rare admin toggle.
 */
export function useMaintenanceMode() {
  const { data: isMaintenanceMode = false } = useQuery({
    queryKey: ['maintenance-mode'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_maintenance_mode');
      if (error) return false;
      return data ?? false;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchInterval: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return { isMaintenanceMode };
}
