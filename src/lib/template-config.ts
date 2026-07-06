// Helpers for serializing/deserializing engagement-order config into template snapshots.

export interface TemplateConfigSnapshot {
  platform?: string;
  base_quantity?: number;
  is_organic_mode?: boolean;
  is_auto_ratios?: boolean;
  engagements?: Record<string, any>;
  order_mode?: 'single' | 'mass';
  bundle_id?: string | null;
  meta?: Record<string, any>;
}

export const COLOR_LABELS = [
  { key: 'blue', hex: '#3B82F6' },
  { key: 'orange', hex: '#F26522' },
  { key: 'green', hex: '#10B981' },
  { key: 'purple', hex: '#7B2CBF' },
  { key: 'red', hex: '#EF4444' },
  { key: 'yellow', hex: '#F59E0B' },
] as const;

export const TEMPLATE_CATEGORIES = [
  'Instagram', 'TikTok', 'YouTube', 'Facebook', 'Telegram', 'Twitter/X', 'Other',
];

export function colorHex(label: string | null | undefined): string {
  if (!label) return '#94A3B8';
  return COLOR_LABELS.find(c => c.key === label)?.hex || '#94A3B8';
}

export function platformIcon(platform: string | null | undefined): string {
  const p = (platform || '').toLowerCase();
  if (p.includes('instagram')) return '📸';
  if (p.includes('tiktok')) return '🎵';
  if (p.includes('youtube')) return '▶️';
  if (p.includes('facebook')) return '👥';
  if (p.includes('telegram')) return '✈️';
  if (p.includes('twitter') || p === 'x') return '🐦';
  return '⭐';
}
