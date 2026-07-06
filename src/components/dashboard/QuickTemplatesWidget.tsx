import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, ChevronRight, Star, Play } from 'lucide-react';
import { useTemplates, useTemplateSettings, DEFAULT_TEMPLATE_SETTINGS, useTemplateMutations } from '@/hooks/useTemplates';
import { colorHex, platformIcon } from '@/lib/template-config';

export function QuickTemplatesWidget() {
  const { data: settings = DEFAULT_TEMPLATE_SETTINGS } = useTemplateSettings();
  const { data: templates = [] } = useTemplates();
  const { trackUsage } = useTemplateMutations();
  const navigate = useNavigate();

  if (!settings.enabled || !settings.allow_dashboard_widget) return null;

  const top = templates.slice(0, 4);

  return (
    <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid #efeaf7' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FAF5FF' }}>
            <Bookmark className="w-4 h-4" style={{ color: '#7B2CBF' }} />
          </div>
          <h3 className="font-bold text-[15px]" style={{ color: '#0B0B16' }}>Quick Templates</h3>
        </div>
        <Link to="/templates" className="text-[12px] font-semibold flex items-center gap-0.5" style={{ color: '#F26522' }}>
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {top.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-[13px]" style={{ color: '#7d6f97' }}>No templates saved yet.</p>
          <Link to="/engagement-order?newTemplate=1"
            className="inline-flex items-center gap-1.5 mt-3 h-9 px-4 rounded-xl text-[12px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #F26522 0%, #D63384 50%, #7B2CBF 100%)' }}>
            Create template
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {top.map(t => (
            <li key={t.id}>
              <button onClick={() => { trackUsage.mutate(t.id); navigate(`/engagement-order?template=${t.id}`); }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-orange-50/60 text-left">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: '#FAF7FF', borderLeft: `3px solid ${colorHex(t.color_label)}` }}>
                  {platformIcon(t.platform)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {t.is_favorite && <Star className="w-3 h-3 shrink-0" fill="#F26522" color="#F26522" />}
                    <span className="text-[13px] font-semibold truncate" style={{ color: '#0B0B16' }}>{t.name}</span>
                  </div>
                  <div className="text-[10.5px] truncate" style={{ color: '#a99dc1' }}>
                    Used {t.usage_count}× {t.category ? '· ' + t.category : ''}
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 shrink-0" style={{ color: '#F26522' }} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
