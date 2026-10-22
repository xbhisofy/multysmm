import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Service } from '@/lib/supabase';

export function useSingleOrderServices() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['single-order-services'],
    enabled: Boolean(user),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const services: Service[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from('services')
          .select('*').eq('is_active', true).not('provider_id', 'is', null)
          .order('category').order('id').range(offset, offset + 999);
        if (error) throw error;
        services.push(...(data as Service[]));
        if (data.length < 1000) break;
      }
      return services;
    },
  });
}