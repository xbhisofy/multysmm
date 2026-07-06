import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageMeta } from '@/components/seo/PageMeta';
import { useTemplates, useTemplateSettings, DEFAULT_TEMPLATE_SETTINGS, OrderTemplate } from '@/hooks/useTemplates';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TemplateEditorDialog } from '@/components/templates/TemplateEditorDialog';
import { Input } from '@/components/ui/input';
import { Search, Bookmark, Plus, Sparkles } from 'lucide-react';
import { TEMPLATE_CATEGORIES } from '@/lib/template-config';
import { Link } from 'react-router-dom';

type SortKey = 'recent_used' | 'most_used' | 'created' | 'alpha';

export default function Templates() {
  const { data: templates = [], isLoading } = useTemplates();
  const { data: settings = DEFAULT_TEMPLATE_SETTINGS } = useTemplateSettings();
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('recent_used');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<OrderTemplate | null>(null);

  const filtered = useMemo(() => {
    let list = templates.filter(t => {
      if (showFavOnly && !t.is_favorite) return false;
      if (platformFilter !== 'all' && (t.category || '').toLowerCase() !== platformFilter.toLowerCase()) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!(t.name.toLowerCase().includes(s) || (t.description || '').toLowerCase().includes(s) || (t.category || '').toLowerCase().includes(s))) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
      switch (sort) {
        case 'most_used': return (b.usage_count || 0) - (a.usage_count || 0);
        case 'created': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'alpha': return a.name.localeCompare(b.name);
        case 'recent_used':
        default:
          return (new Date(b.last_used_at || b.created_at).getTime()) - (new Date(a.last_used_at || a.created_at).getTime());
      }
    });
    return list;
  }, [templates, search, platformFilter, showFavOnly, sort]);

  const startEdit = (t: OrderTemplate) => { setEditing(t); setEditorOpen(true); };

  if (!settings.enabled) {
    return (
      <DashboardLayout>
        <PageMeta title="Smart Templates" description="Smart order templates" />
        <div className="max-w-2xl mx-auto p-8 text-center">
          <Bookmark className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-xl font-bold">Templates are disabled</h1>
          <p className="text-sm text-muted-foreground mt-1">An admin has turned off this feature.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageMeta title="Smart Order Templates — MultySMM" description="Save your favorite order configurations and reuse them in seconds." />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-1 rounded-md mb-2"
              style={{ background: '#FAF5FF', color: '#7B2CBF' }}>
              <Sparkles className="w-3 h-3" /> Smart Templates
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.02em]" style={{ color: '#0B0B16' }}>Your Order Templates</h1>
            <p className="text-sm mt-1" style={{ color: '#7d6f97' }}>
              Save order settings once. Paste a link. Place order. Done.
            </p>
          </div>
          <Link to="/engagement-order?newTemplate=1"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[13px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #F26522 0%, #D63384 50%, #7B2CBF 100%)' }}>
            <Plus className="w-4 h-4" /> Create Template
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search templates…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
          </div>
          <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">All categories</option>
            {TEMPLATE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="recent_used">Recently used</option>
            <option value="most_used">Most used</option>
            <option value="created">Newest</option>
            <option value="alpha">A → Z</option>
          </select>
          {settings.allow_favorites && (
            <button onClick={() => setShowFavOnly(v => !v)}
              className="h-10 px-3 rounded-md border text-sm font-medium"
              style={{
                background: showFavOnly ? '#FEF3C7' : 'white',
                borderColor: showFavOnly ? '#F59E0B' : '#e5e7eb',
                color: showFavOnly ? '#92400E' : '#0B0B16',
              }}>
              ⭐ Favorites
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-16">Loading templates…</div>
        ) : filtered.length === 0 ? (
          <EmptyState hasAny={templates.length > 0} />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(t => <TemplateCard key={t.id} template={t} onEdit={startEdit}
              allowDuplicate={settings.allow_duplicate}
              allowFavorite={settings.allow_favorites}
              allowColor={settings.allow_color_labels} />)}
          </div>
        )}

        <TemplateEditorDialog open={editorOpen} onOpenChange={setEditorOpen} template={editing} />

        <p className="text-[11px] text-center text-muted-foreground mt-8">
          {templates.length} / {settings.max_per_user} templates used
        </p>
      </div>
    </DashboardLayout>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="text-center py-16 rounded-2xl" style={{ background: '#FAF7FF', border: '1px dashed #E5D7FA' }}>
      <Bookmark className="w-10 h-10 mx-auto mb-3" style={{ color: '#7B2CBF' }} />
      <h3 className="text-lg font-bold" style={{ color: '#0B0B16' }}>
        {hasAny ? 'No templates match your filters' : 'No templates yet'}
      </h3>
      <p className="text-sm mt-1 max-w-md mx-auto" style={{ color: '#7d6f97' }}>
        {hasAny
          ? 'Try clearing your search or filters.'
          : 'Configure an order the way you like it, then save it as a template. Reuse it anytime — just paste a new link.'}
      </p>
      {!hasAny && (
        <Link to="/engagement-order?newTemplate=1"
          className="inline-flex items-center gap-2 mt-5 h-10 px-5 rounded-xl text-[13px] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #F26522 0%, #D63384 50%, #7B2CBF 100%)' }}>
          <Plus className="w-4 h-4" /> Create your first template
        </Link>
      )}
    </div>
  );
}
