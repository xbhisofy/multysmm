import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { AdminFilters, DateBucket, AmountBucket, OrdersBucket, StatusFilter, LoginBucket } from '@/lib/admin-users-filters';
import { activeFilterCount, DEFAULT_FILTERS } from '@/lib/admin-users-filters';

interface Props {
  value: AdminFilters;
  onChange: (v: AdminFilters) => void;
}

const dateOpts: { v: DateBucket; l: string }[] = [
  { v: 'any', l: 'Any' }, { v: 'today', l: 'Today' }, { v: 'yesterday', l: 'Yesterday' },
  { v: 'last7', l: 'Last 7d' }, { v: 'last30', l: 'Last 30d' }, { v: 'custom', l: 'Custom' },
];
const fundOpts: { v: DateBucket; l: string }[] = [...dateOpts.filter(o => o.v !== 'yesterday'), { v: 'never', l: 'Never' }];

const amountOpts = (isDep = false): { v: AmountBucket; l: string }[] => [
  { v: 'any', l: 'Any' }, { v: 'zero', l: '₹0' },
  { v: 'b1', l: isDep ? '₹1–1k' : '₹1–500' },
  { v: 'b2', l: isDep ? '₹1k–10k' : '₹500–5k' },
  { v: 'b3', l: isDep ? '₹10k+' : '₹5k+' },
  { v: 'custom', l: 'Custom' },
];

const orderOpts: { v: OrdersBucket; l: string }[] = [
  { v: 'any', l: 'Any' }, { v: 'zero', l: 'None' }, { v: 'b1', l: '1–10' },
  { v: 'b2', l: '10–100' }, { v: 'b3', l: '100+' }, { v: 'custom', l: 'Custom' },
];

const statusOpts: { v: StatusFilter; l: string }[] = [
  { v: 'any', l: 'Any' }, { v: 'active', l: 'Active' }, { v: 'banned', l: 'Banned' },
];
const loginOpts: { v: LoginBucket; l: string }[] = [
  { v: 'any', l: 'Any' }, { v: 'today', l: 'Today' }, { v: 'last7', l: 'Last 7d' },
  { v: 'last30', l: 'Last 30d' }, { v: 'never', l: 'Never' },
];

function ChipGroup<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`h-7 px-2.5 rounded-md text-[11px] font-medium border transition-colors ${
            value === o.v
              ? 'bg-foreground text-background border-foreground'
              : 'bg-secondary text-foreground border-border hover:bg-muted'
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function UserFiltersSheet({ value, onChange }: Props) {
  const count = activeFilterCount(value);
  const set = <K extends keyof AdminFilters>(k: K, v: AdminFilters[K]) => onChange({ ...value, [k]: v });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 rounded-xl gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {count > 0 && <Badge className="ml-1 h-5 px-1.5 text-[10px]">{count}</Badge>}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Filters</span>
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => onChange(DEFAULT_FILTERS)}>
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-5">
          {/* Registration Date */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registration Date</Label>
            <ChipGroup value={value.regDate} onChange={(v) => set('regDate', v)} options={dateOpts} />
            {value.regDate === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={value.regFrom || ''} onChange={e => set('regFrom', e.target.value)} />
                <Input type="date" value={value.regTo || ''} onChange={e => set('regTo', e.target.value)} />
              </div>
            )}
          </div>

          {/* Last Fund */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Fund Added</Label>
            <ChipGroup value={value.fundDate} onChange={(v) => set('fundDate', v)} options={fundOpts} />
            {value.fundDate === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={value.fundFrom || ''} onChange={e => set('fundFrom', e.target.value)} />
                <Input type="date" value={value.fundTo || ''} onChange={e => set('fundTo', e.target.value)} />
              </div>
            )}
          </div>

          {/* Wallet */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Wallet Balance</Label>
            <ChipGroup value={value.wallet} onChange={(v) => set('wallet', v)} options={amountOpts(false)} />
            {value.wallet === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Min ₹" type="number" value={value.walletMin || ''} onChange={e => set('walletMin', e.target.value)} />
                <Input placeholder="Max ₹" type="number" value={value.walletMax || ''} onChange={e => set('walletMax', e.target.value)} />
              </div>
            )}
          </div>

          {/* Deposits */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Deposits</Label>
            <ChipGroup value={value.deposits} onChange={(v) => set('deposits', v)} options={amountOpts(true)} />
            {value.deposits === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Min ₹" type="number" value={value.depMin || ''} onChange={e => set('depMin', e.target.value)} />
                <Input placeholder="Max ₹" type="number" value={value.depMax || ''} onChange={e => set('depMax', e.target.value)} />
              </div>
            )}
          </div>

          {/* Spending */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Spending</Label>
            <ChipGroup value={value.spending} onChange={(v) => set('spending', v)} options={amountOpts(true)} />
            {value.spending === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Min ₹" type="number" value={value.spendMin || ''} onChange={e => set('spendMin', e.target.value)} />
                <Input placeholder="Max ₹" type="number" value={value.spendMax || ''} onChange={e => set('spendMax', e.target.value)} />
              </div>
            )}
          </div>

          {/* Orders */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Orders</Label>
            <ChipGroup value={value.orders} onChange={(v) => set('orders', v)} options={orderOpts} />
            {value.orders === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Min" type="number" value={value.ordMin || ''} onChange={e => set('ordMin', e.target.value)} />
                <Input placeholder="Max" type="number" value={value.ordMax || ''} onChange={e => set('ordMax', e.target.value)} />
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">User Status</Label>
            <ChipGroup value={value.status} onChange={(v) => set('status', v)} options={statusOpts} />
          </div>

          {/* Last Login */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Login</Label>
            <ChipGroup value={value.login} onChange={(v) => set('login', v)} options={loginOpts} />
          </div>
        </div>

        <SheetFooter>
          <p className="text-[11px] text-muted-foreground text-center w-full">Filters apply instantly to the visible list.</p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
