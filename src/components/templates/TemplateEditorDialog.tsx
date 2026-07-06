import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { OrderTemplate, useTemplateMutations, useTemplateSettings, DEFAULT_TEMPLATE_SETTINGS } from '@/hooks/useTemplates';
import { COLOR_LABELS, TEMPLATE_CATEGORIES } from '@/lib/template-config';
import { Star } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  template?: OrderTemplate | null;
  snapshot?: any; // config snapshot passed from EO "Save as Template"
  serviceSnapshot?: any;
  platform?: string | null;
  serviceId?: string | null;
  onSaved?: (t: OrderTemplate) => void;
}

export function TemplateEditorDialog({ open, onOpenChange, template, snapshot, serviceSnapshot, platform, serviceId, onSaved }: Props) {
  const { data: settings = DEFAULT_TEMPLATE_SETTINGS } = useTemplateSettings();
  const { create, update } = useTemplateMutations();
  const isEdit = !!template;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (template) {
      setName(template.name || '');
      setDescription(template.description || '');
      setCategory(template.category || '');
      setColor(template.color_label || '');
      setFavorite(template.is_favorite || false);
    } else {
      setName('');
      setDescription('');
      setCategory(platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : '');
      setColor('');
      setFavorite(false);
    }
  }, [open, template, platform]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed.length > settings.max_name_length) return;
    if ((description || '').length > settings.max_description_length) return;

    const payload: any = {
      name: trimmed,
      description: description.trim() || null,
      category: category || null,
      color_label: color || null,
      is_favorite: favorite,
    };

    if (isEdit) {
      const res = await update.mutateAsync({ id: template!.id, patch: payload });
      onSaved?.(res);
    } else {
      payload.platform = platform || null;
      payload.service_id = serviceId || null;
      payload.service_snapshot = serviceSnapshot || {};
      payload.config = snapshot || {};
      const res = await create.mutateAsync(payload);
      onSaved?.(res);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Template' : 'Save as Template'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Template name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} maxLength={settings.max_name_length}
              placeholder="e.g. Viral Reel Boost" className="mt-1.5" />
            <p className="text-[10.5px] mt-1 text-muted-foreground">{name.length}/{settings.max_name_length}</p>
          </div>

          {settings.allow_descriptions && (
            <div>
              <Label>Note (optional)</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)}
                maxLength={settings.max_description_length} rows={2}
                placeholder="e.g. Safe organic delivery for VIP clients" className="mt-1.5" />
            </div>
          )}

          {settings.allow_categories && (
            <div>
              <Label>Category</Label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">— None —</option>
                {TEMPLATE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {settings.allow_color_labels && (
            <div>
              <Label>Color label</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <button type="button" onClick={() => setColor('')}
                  className="w-8 h-8 rounded-full border-2 text-[10px] font-bold"
                  style={{ borderColor: color === '' ? '#0B0B16' : '#e5e7eb', color: '#94A3B8' }}>—</button>
                {COLOR_LABELS.map(c => (
                  <button key={c.key} type="button" onClick={() => setColor(c.key)}
                    className="w-8 h-8 rounded-full border-2"
                    style={{ background: c.hex, borderColor: color === c.key ? '#0B0B16' : 'transparent' }}
                    aria-label={c.key} />
                ))}
              </div>
            </div>
          )}

          {settings.allow_favorites && (
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><Star className="w-4 h-4" /> Mark as favorite</Label>
              <Switch checked={favorite} onCheckedChange={setFavorite} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || create.isPending || update.isPending}>
            {isEdit ? 'Save changes' : 'Save template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
