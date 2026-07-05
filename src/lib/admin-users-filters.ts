export const INR_RATE = 83.5;

export type SortKey =
  | 'last_fund'
  | 'wallet_desc' | 'wallet_asc'
  | 'deposits_desc' | 'deposits_asc'
  | 'spending_desc' | 'spending_asc'
  | 'orders_desc' | 'orders_asc'
  | 'reg_desc' | 'reg_asc'
  | 'active_desc' | 'active_asc'
  | 'ltv_desc'
  | 'az' | 'za';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'last_fund', label: 'Last Fund Added (Default)' },
  { key: 'wallet_desc', label: 'Highest Wallet Balance' },
  { key: 'wallet_asc', label: 'Lowest Wallet Balance' },
  { key: 'deposits_desc', label: 'Highest Total Deposits' },
  { key: 'deposits_asc', label: 'Lowest Total Deposits' },
  { key: 'spending_desc', label: 'Highest Total Spending' },
  { key: 'spending_asc', label: 'Lowest Total Spending' },
  { key: 'orders_desc', label: 'Highest Number of Orders' },
  { key: 'orders_asc', label: 'Lowest Number of Orders' },
  { key: 'reg_desc', label: 'Most Recently Registered' },
  { key: 'reg_asc', label: 'Oldest Registered' },
  { key: 'active_desc', label: 'Most Recently Active' },
  { key: 'active_asc', label: 'Least Recently Active' },
  { key: 'ltv_desc', label: 'Highest Lifetime Value (LTV)' },
  { key: 'az', label: 'Alphabetical (A → Z)' },
  { key: 'za', label: 'Alphabetical (Z → A)' },
];

export type DateBucket = 'any' | 'today' | 'yesterday' | 'last7' | 'last30' | 'never' | 'custom';
export type AmountBucket = 'any' | 'zero' | 'b1' | 'b2' | 'b3' | 'custom';
export type OrdersBucket = 'any' | 'zero' | 'b1' | 'b2' | 'b3' | 'custom';
export type StatusFilter = 'any' | 'active' | 'banned';
export type LoginBucket = 'any' | 'today' | 'last7' | 'last30' | 'never';

export interface AdminFilters {
  regDate: DateBucket;
  regFrom?: string; regTo?: string;
  fundDate: DateBucket;
  fundFrom?: string; fundTo?: string;
  wallet: AmountBucket;
  walletMin?: string; walletMax?: string;
  deposits: AmountBucket;
  depMin?: string; depMax?: string;
  spending: AmountBucket;
  spendMin?: string; spendMax?: string;
  orders: OrdersBucket;
  ordMin?: string; ordMax?: string;
  status: StatusFilter;
  login: LoginBucket;
}

export const DEFAULT_FILTERS: AdminFilters = {
  regDate: 'any', fundDate: 'any', wallet: 'any',
  deposits: 'any', spending: 'any', orders: 'any',
  status: 'any', login: 'any',
};

export function activeFilterCount(f: AdminFilters): number {
  let n = 0;
  if (f.regDate !== 'any') n++;
  if (f.fundDate !== 'any') n++;
  if (f.wallet !== 'any') n++;
  if (f.deposits !== 'any') n++;
  if (f.spending !== 'any') n++;
  if (f.orders !== 'any') n++;
  if (f.status !== 'any') n++;
  if (f.login !== 'any') n++;
  return n;
}

// ------- Row shape used by UI -------
export interface Row {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  telegram_username?: string | null;
  created_at: string;
  updated_at?: string | null;
  is_banned?: boolean;
  banned_reason?: string | null;
  role?: string;
  plan_type?: string;
  subscription_status?: string;
  subscription_expires?: string | null;

  balance: number;           // USD
  total_deposited: number;   // USD
  total_spent: number;       // USD

  last_deposit_at?: string | null;
  deposit_count?: number;
  total_orders_count?: number;
  single_orders_count?: number;
  engagement_orders_count?: number;
  last_active_at?: string | null;
  last_sign_in_at?: string | null;

  active_single_orders?: number;
  paused_single_orders?: number;
  active_engagement_orders?: number;
  paused_engagement_orders?: number;
}

// ------- Date helpers -------
function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function daysAgo(n: number) { const d = startOfDay(); d.setDate(d.getDate() - n); return d; }

function inDateBucket(iso: string | null | undefined, bucket: DateBucket, from?: string, to?: string): boolean {
  if (bucket === 'any') return true;
  if (bucket === 'never') return !iso;
  if (!iso) return false;
  const t = new Date(iso).getTime();
  const now = new Date();
  if (bucket === 'today')     return t >= startOfDay(now).getTime();
  if (bucket === 'yesterday') return t >= daysAgo(1).getTime() && t < startOfDay(now).getTime();
  if (bucket === 'last7')     return t >= daysAgo(7).getTime();
  if (bucket === 'last30')    return t >= daysAgo(30).getTime();
  if (bucket === 'custom') {
    const f = from ? new Date(from).getTime() : -Infinity;
    const to2 = to ? new Date(to).getTime() + 86_399_999 : Infinity;
    return t >= f && t <= to2;
  }
  return true;
}

function inAmountBucket(inr: number, bucket: AmountBucket, min?: string, max?: string, buckets: [number, number][] = [[1,500],[500,5000],[5000,Infinity]]): boolean {
  if (bucket === 'any') return true;
  if (bucket === 'zero') return inr <= 0.001;
  if (bucket === 'custom') {
    const lo = min ? parseFloat(min) : -Infinity;
    const hi = max ? parseFloat(max) : Infinity;
    return inr >= lo && inr <= hi;
  }
  const idx = { b1: 0, b2: 1, b3: 2 }[bucket]!;
  const [lo, hi] = buckets[idx];
  return inr >= lo && inr < hi;
}

function inOrdersBucket(n: number, bucket: OrdersBucket, min?: string, max?: string): boolean {
  if (bucket === 'any') return true;
  if (bucket === 'zero') return n === 0;
  if (bucket === 'custom') {
    const lo = min ? parseInt(min, 10) : -Infinity;
    const hi = max ? parseInt(max, 10) : Infinity;
    return n >= lo && n <= hi;
  }
  if (bucket === 'b1') return n >= 1 && n <= 10;
  if (bucket === 'b2') return n > 10 && n <= 100;
  if (bucket === 'b3') return n > 100;
  return true;
}

function inLoginBucket(iso: string | null | undefined, bucket: LoginBucket): boolean {
  if (bucket === 'any') return true;
  if (bucket === 'never') return !iso;
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (bucket === 'today')  return t >= startOfDay().getTime();
  if (bucket === 'last7')  return t >= daysAgo(7).getTime();
  if (bucket === 'last30') return t >= daysAgo(30).getTime();
  return true;
}

export function applyFilters(rows: Row[], f: AdminFilters, search: string): Row[] {
  const q = search.trim().toLowerCase();
  const depBuckets: [number, number][] = [[1,1000],[1000,10000],[10000,Infinity]];
  const spendBuckets = depBuckets;
  return rows.filter(r => {
    // search
    if (q) {
      const hay = [r.email, r.full_name || '', r.user_id, r.id, r.telegram_username || '']
        .join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (!inDateBucket(r.created_at, f.regDate, f.regFrom, f.regTo)) return false;
    if (!inDateBucket(r.last_deposit_at, f.fundDate, f.fundFrom, f.fundTo)) return false;

    const walletInr = (r.balance || 0) * INR_RATE;
    const depInr    = (r.total_deposited || 0) * INR_RATE;
    const spendInr  = (r.total_spent || 0) * INR_RATE;

    if (!inAmountBucket(walletInr, f.wallet, f.walletMin, f.walletMax)) return false;
    if (!inAmountBucket(depInr, f.deposits, f.depMin, f.depMax, depBuckets)) return false;
    if (!inAmountBucket(spendInr, f.spending, f.spendMin, f.spendMax, spendBuckets)) return false;
    if (!inOrdersBucket(r.total_orders_count || 0, f.orders, f.ordMin, f.ordMax)) return false;

    if (f.status === 'active' && r.is_banned) return false;
    if (f.status === 'banned' && !r.is_banned) return false;

    if (!inLoginBucket(r.last_sign_in_at, f.login)) return false;
    return true;
  });
}

export function applySort(rows: Row[], key: SortKey): Row[] {
  const arr = [...rows];
  const t = (s?: string | null) => (s ? new Date(s).getTime() : 0);
  const nameOf = (r: Row) => (r.full_name || r.email || '').toLowerCase();
  const ltv = (r: Row) => (r.total_deposited || 0) + (r.total_spent || 0);

  const cmp: Record<SortKey, (a: Row, b: Row) => number> = {
    last_fund:    (a, b) => t(b.last_deposit_at) - t(a.last_deposit_at),
    wallet_desc:  (a, b) => (b.balance||0) - (a.balance||0),
    wallet_asc:   (a, b) => (a.balance||0) - (b.balance||0),
    deposits_desc:(a, b) => (b.total_deposited||0) - (a.total_deposited||0),
    deposits_asc: (a, b) => (a.total_deposited||0) - (b.total_deposited||0),
    spending_desc:(a, b) => (b.total_spent||0) - (a.total_spent||0),
    spending_asc: (a, b) => (a.total_spent||0) - (b.total_spent||0),
    orders_desc:  (a, b) => (b.total_orders_count||0) - (a.total_orders_count||0),
    orders_asc:   (a, b) => (a.total_orders_count||0) - (b.total_orders_count||0),
    reg_desc:     (a, b) => t(b.created_at) - t(a.created_at),
    reg_asc:      (a, b) => t(a.created_at) - t(b.created_at),
    active_desc:  (a, b) => t(b.last_active_at) - t(a.last_active_at),
    active_asc:   (a, b) => t(a.last_active_at) - t(b.last_active_at),
    ltv_desc:     (a, b) => ltv(b) - ltv(a),
    az:           (a, b) => nameOf(a).localeCompare(nameOf(b)),
    za:           (a, b) => nameOf(b).localeCompare(nameOf(a)),
  };
  arr.sort(cmp[key]);
  return arr;
}

// CSV export
export function rowsToCsv(rows: Row[]): string {
  const headers = ['user_id','email','full_name','telegram','wallet_inr','deposits_inr','spending_inr','ltv_inr','orders','last_fund_at','last_login_at','registered_at','status'];
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      r.user_id, r.email, r.full_name || '', r.telegram_username || '',
      ((r.balance||0)*INR_RATE).toFixed(2),
      ((r.total_deposited||0)*INR_RATE).toFixed(2),
      ((r.total_spent||0)*INR_RATE).toFixed(2),
      (((r.total_deposited||0)+(r.total_spent||0))*INR_RATE).toFixed(2),
      r.total_orders_count || 0,
      r.last_deposit_at || '',
      r.last_sign_in_at || '',
      r.created_at,
      r.is_banned ? 'banned' : 'active',
    ].map(escape).join(','));
  }
  return lines.join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// UI color indicator
export type Indicator = 'green' | 'orange' | 'blue' | 'red' | 'gray' | null;
export function indicatorFor(r: Row): Indicator {
  if (r.is_banned) return 'red';
  if (!r.last_deposit_at) return 'gray';
  const now = Date.now();
  const dep = new Date(r.last_deposit_at).getTime();
  const active = r.last_active_at ? new Date(r.last_active_at).getTime() : dep;
  const ltvInr = ((r.total_deposited||0)+(r.total_spent||0)) * INR_RATE;
  if (ltvInr >= 10000) return 'blue';
  if (now - dep <= 7 * 86_400_000) return 'green';
  if (now - active >= 30 * 86_400_000) return 'orange';
  return null;
}
