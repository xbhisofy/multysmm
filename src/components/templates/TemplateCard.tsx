import { Star, Copy, Pencil, Trash2, Play, AlertTriangle } from 'lucide-react';
import { OrderTemplate, useTemplateMutations } from '@/hooks/useTemplates';
import { colorHex, platformIcon } from '@/lib/template-config';
import { useNavigate } from 'react-router-dom';

interface Props {
  template: OrderTemplate;
  onEdit: (t: OrderTemplate) => void;
  allowDuplicate?: boolean;
  allowFavorite?: boolean;
  allowColor?: boolean;
}

export function TemplateCard({ template: t, onEdit, allowDuplicate = true, allowFavorite = true, allowColor = true }: Props) {
  const { toggleFavorite, duplicate, remove, trackUsage } = useTemplateMutations();
  const navigate = useNavigate();

  const c = t.config || {};
  const firstEng: any = Object.values(c.engagements || {})[0] || {};
  const qty = c.base_quantity ?? c.quantity ?? '—';
  const runs = c.runs ?? firstEng.runs ?? '—';
  const interval = c.interval ?? firstEng.drip_interval ?? '—';

  const useIt = () => {
    trackUsage.mutate(t.id);
    navigate(`/engagement-order?template=${t.id}`);
  };

  return (
    <div className="relative rounded-2xl bg-white p-5 flex flex-col gap-4 transition-all hover:-translate-y-0.5"
      style={{ border: '1px solid #efeaf7', boxShadow: '0 4px 12px -6px rgba(124,58,237,.08)' }}>
      {/* Color strip */}
      {allowColor && (
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: colorHex(t.color_label) }} />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: '#FAF5FF' }}>
            {platformIcon(t.platform)}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[15px] tracking-tight truncate" style={{ color: '#0B0B16' }}>{t.name}</h3>
            {t.service_snapshot?.name && (
              <p className="text-[11.5px] truncate" style={{ color: '#7d6f97' }}>{t.service_snapshot.name}</p>
            )}
          </div>
        </div>
        {allowFavorite && (
          <button onClick={() => toggleFavorite.mutate(t)} className="shrink-0 p-1.5 rounded-lg hover:bg-orange-50" aria-label="Favorite">
            <Star className="w-4 h-4" fill={t.is_favorite ? '#F26522' : 'transparent'} color={t.is_favorite ? '#F26522' : '#a99dc1'} />
          </button>
        )}
      </div>

      {t.description && (
        <p className="text-[12px] line-clamp-2" style={{ color: '#7d6f97' }}>{t.description}</p>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Qty" value={String(qty)} />
        <Stat label="Runs" value={String(runs)} />
        <Stat label="Interval" value={String(interval)} />
      </div>

      <div className="flex items-center justify-between text-[10.5px]" style={{ color: '#a99dc1' }}>
        <span>Used {t.usage_count}× {t.last_used_at ? '· ' + new Date(t.last_used_at).toLocaleDateString() : ''}</span>
        {t.category && <span className="px-1.5 py-0.5 rounded-md" style={{ background: '#FAF5FF', color: '#7B2CBF' }}>{t.category}</span>}
      </div>

      {!t.service_id && (
        <div className="flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-lg" style={{ background: '#FEF3C7', color: '#92400E' }}>
          <AlertTriangle className="w-3.5 h-3.5" /> Discontinued service — edit or delete
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-auto">
        <button onClick={useIt}
          className="flex-1 h-9 rounded-xl text-[12.5px] font-bold text-white flex items-center justify-center gap-1.5"
          style={{ background: 'linear-gradient(135deg, #F26522 0%, #D63384 50%, #7B2CBF 100%)' }}>
          <Play className="w-3.5 h-3.5" /> Use Template
        </button>
        <IconBtn onClick={() => onEdit(t)} title="Edit"><Pencil className="w-3.5 h-3.5" /></IconBtn>
        {allowDuplicate && <IconBtn onClick={() => duplicate.mutate(t)} title="Duplicate"><Copy className="w-3.5 h-3.5" /></IconBtn>}
        <IconBtn onClick={() => { if (confirm(`Delete "${t.name}"?`)) remove.mutate(t.id); }} title="Delete" danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg py-1.5" style={{ background: '#FAF7FF' }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#a99dc1' }}>{label}</div>
      <div className="text-[13px] font-bold" style={{ color: '#0B0B16' }}>{value}</div>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
      style={{
        background: danger ? '#FEF2F2' : '#FAF7FF',
        color: danger ? '#DC2626' : '#7d6f97',
        border: '1px solid ' + (danger ? '#FECACA' : '#efeaf7'),
      }}>{children}</button>
  );
}
