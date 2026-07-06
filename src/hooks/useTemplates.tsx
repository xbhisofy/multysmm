import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface OrderTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_favorite: boolean;
  color_label: string | null;
  platform: string | null;
  service_id: string | null;
  service_snapshot: any;
  config: any;
  usage_count: number;
  last_used_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateSettings {
  enabled: boolean;
  max_per_user: number;
  allow_categories: boolean;
  allow_favorites: boolean;
  allow_color_labels: boolean;
  allow_descriptions: boolean;
  allow_duplicate: boolean;
  allow_archive: boolean;
  allow_dashboard_widget: boolean;
  allow_save_after_order: boolean;
  allow_save_from_repeat: boolean;
  max_name_length: number;
  max_description_length: number;
}

export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  enabled: true,
  max_per_user: 50,
  allow_categories: true,
  allow_favorites: true,
  allow_color_labels: true,
  allow_descriptions: true,
  allow_duplicate: true,
  allow_archive: true,
  allow_dashboard_widget: true,
  allow_save_after_order: true,
  allow_save_from_repeat: true,
  max_name_length: 60,
  max_description_length: 300,
};

export function useTemplateSettings() {
  return useQuery({
    queryKey: ['template-settings'],
    queryFn: async (): Promise<TemplateSettings> => {
      const { data } = await supabase.from('template_settings').select('*').maybeSingle();
      return (data as any) || DEFAULT_TEMPLATE_SETTINGS;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTemplates(opts?: { includeArchived?: boolean }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['order-templates', user?.id, opts?.includeArchived ?? false],
    enabled: !!user?.id,
    queryFn: async (): Promise<OrderTemplate[]> => {
      let q = supabase.from('order_templates').select('*').eq('user_id', user!.id);
      if (!opts?.includeArchived) q = q.eq('is_archived', false);
      const { data, error } = await q.order('is_favorite', { ascending: false }).order('last_used_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any) || [];
    },
  });
}

export function useTemplate(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['order-template', id],
    enabled: !!id && !!user?.id,
    queryFn: async (): Promise<OrderTemplate | null> => {
      const { data } = await supabase.from('order_templates').select('*').eq('id', id!).eq('user_id', user!.id).maybeSingle();
      return (data as any) || null;
    },
  });
}

export function useTemplateMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['order-templates'] });

  const create = useMutation({
    mutationFn: async (t: Partial<OrderTemplate>) => {
      if (!user?.id) throw new Error('Not signed in');
      const payload = { ...t, user_id: user.id };
      const { data, error } = await supabase.from('order_templates').insert(payload as any).select().single();
      if (error) throw error;
      return data as any as OrderTemplate;
    },
    onSuccess: () => { invalidate(); toast.success('Template saved'); },
    onError: (e: any) => toast.error(e?.message || 'Failed to save template'),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<OrderTemplate> }) => {
      const { data, error } = await supabase.from('order_templates').update(patch as any).eq('id', id).select().single();
      if (error) throw error;
      return data as any as OrderTemplate;
    },
    onSuccess: () => { invalidate(); toast.success('Template updated'); },
    onError: (e: any) => toast.error(e?.message || 'Failed to update'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('order_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Template deleted'); },
    onError: (e: any) => toast.error(e?.message || 'Delete failed'),
  });

  const duplicate = useMutation({
    mutationFn: async (t: OrderTemplate) => {
      if (!user?.id) throw new Error('Not signed in');
      const { id, created_at, updated_at, usage_count, last_used_at, ...rest } = t as any;
      const { data, error } = await supabase.from('order_templates').insert({
        ...rest,
        user_id: user.id,
        name: `${t.name} (Copy)`,
        usage_count: 0,
        last_used_at: null,
      } as any).select().single();
      if (error) throw error;
      return data as any as OrderTemplate;
    },
    onSuccess: () => { invalidate(); toast.success('Template duplicated'); },
    onError: (e: any) => toast.error(e?.message || 'Duplicate failed'),
  });

  const toggleFavorite = useMutation({
    mutationFn: async (t: OrderTemplate) => {
      const { error } = await supabase.from('order_templates').update({ is_favorite: !t.is_favorite } as any).eq('id', t.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const trackUsage = useMutation({
    mutationFn: async (id: string) => {
      // Best-effort increment; ignore failure
      const { data } = await supabase.from('order_templates').select('usage_count').eq('id', id).maybeSingle();
      const next = ((data as any)?.usage_count || 0) + 1;
      await supabase.from('order_templates').update({ usage_count: next, last_used_at: new Date().toISOString() } as any).eq('id', id);
    },
    onSuccess: () => invalidate(),
  });

  return { create, update, remove, duplicate, toggleFavorite, trackUsage };
}
