import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { PageMeta } from '@/components/seo/PageMeta';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { DEFAULT_TEMPLATE_SETTINGS, TemplateSettings } from '@/hooks/useTemplates';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminTemplateSettings() {
  const [s, setS] = useState<TemplateSettings>(DEFAULT_TEMPLATE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('template_settings').select('*').maybeSingle();
      if (data) setS(data as any);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('template_settings').update(s as any).eq('id', true);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Settings saved');
    qc.invalidateQueries({ queryKey: ['template-settings'] });
  };

  const Toggle = ({ k, label }: { k: keyof TemplateSettings; label: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-border">
      <Label>{label}</Label>
      <Switch checked={!!s[k]} onCheckedChange={(v) => setS({ ...s, [k]: v } as any)} />
    </div>
  );

  return (
    <Layout>
      <PageMeta title="Template Settings — Admin" description="Admin settings for Smart Order Templates" />
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-black mb-6">Smart Template Settings</h1>

        {loading ? <p>Loading…</p> : (
          <div className="rounded-2xl bg-white p-6" style={{ border: '1px solid #efeaf7' }}>
            <Toggle k="enabled" label="Enable templates feature" />
            <Toggle k="allow_categories" label="Allow categories" />
            <Toggle k="allow_favorites" label="Allow favorites" />
            <Toggle k="allow_color_labels" label="Allow color labels" />
            <Toggle k="allow_descriptions" label="Allow descriptions" />
            <Toggle k="allow_duplicate" label="Allow duplicating templates" />
            <Toggle k="allow_archive" label="Allow archiving" />
            <Toggle k="allow_dashboard_widget" label="Show Quick Templates widget on Dashboard" />
            <Toggle k="allow_save_after_order" label="Show 'Save as Template' after placing order" />
            <Toggle k="allow_save_from_repeat" label="Allow saving from Repeat Order" />

            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <div>
                <Label>Max per user</Label>
                <Input type="number" min={1} max={500} value={s.max_per_user}
                  onChange={e => setS({ ...s, max_per_user: Number(e.target.value) || 1 })} />
              </div>
              <div>
                <Label>Max name length</Label>
                <Input type="number" min={10} max={200} value={s.max_name_length}
                  onChange={e => setS({ ...s, max_name_length: Number(e.target.value) || 60 })} />
              </div>
              <div>
                <Label>Max description length</Label>
                <Input type="number" min={20} max={2000} value={s.max_description_length}
                  onChange={e => setS({ ...s, max_description_length: Number(e.target.value) || 300 })} />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
