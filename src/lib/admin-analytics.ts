export type RangeKey =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lifetime'
  | 'custom';

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 Days',
  last30: 'Last 30 Days',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  thisYear: 'This Year',
  lifetime: 'Lifetime',
  custom: 'Custom',
};

export function resolveRange(
  key: RangeKey,
  custom?: { from: Date; to: Date }
): { from: Date; to: Date } {
  const now = new Date();
  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  switch (key) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'last7': {
      const f = new Date(now);
      f.setDate(f.getDate() - 6);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    case 'last30': {
      const f = new Date(now);
      f.setDate(f.getDate() - 29);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    case 'thisMonth':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        to: endOfDay(now),
      };
    case 'lastMonth': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from, to };
    }
    case 'thisYear':
      return { from: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0), to: endOfDay(now) };
    case 'lifetime':
      return { from: new Date('2020-01-01T00:00:00Z'), to: endOfDay(now) };
    case 'custom':
      return {
        from: startOfDay(custom?.from ?? now),
        to: endOfDay(custom?.to ?? now),
      };
  }
}

export const USD_TO_INR = 83.5;

export function inr(usd: number | string | null | undefined): string {
  const n = Number(usd || 0) * USD_TO_INR;
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function num(n: number | string | null | undefined): string {
  return Number(n || 0).toLocaleString('en-IN');
}

export function growth(cur: number, prev: number): { pct: number | null; dir: 'up' | 'down' | 'flat' } {
  const c = Number(cur || 0);
  const p = Number(prev || 0);
  if (p === 0) {
    if (c === 0) return { pct: 0, dir: 'flat' };
    return { pct: null, dir: c > 0 ? 'up' : 'down' };
  }
  const pct = ((c - p) / p) * 100;
  return { pct, dir: pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat' };
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
