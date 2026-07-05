import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

export type WalletRangeKey = 'today' | 'yesterday' | 'last7' | 'last30' | 'lifetime' | 'custom';

export const WALLET_RANGE_LABELS: Record<WalletRangeKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 Days',
  last30: 'Last 30 Days',
  lifetime: 'Lifetime',
  custom: 'Custom Range',
};

const PRESETS: WalletRangeKey[] = ['today', 'yesterday', 'last7', 'last30', 'lifetime'];

export function resolveWalletRange(
  key: WalletRangeKey,
  custom?: { from: Date; to: Date }
): { from?: Date; to?: Date } {
  const now = new Date();
  const sod = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const eod = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
  switch (key) {
    case 'today': return { from: sod(now), to: eod(now) };
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      return { from: sod(y), to: eod(y) };
    }
    case 'last7': {
      const f = new Date(now); f.setDate(f.getDate() - 6);
      return { from: sod(f), to: eod(now) };
    }
    case 'last30': {
      const f = new Date(now); f.setDate(f.getDate() - 29);
      return { from: sod(f), to: eod(now) };
    }
    case 'lifetime': return {};
    case 'custom':
      return { from: custom ? sod(custom.from) : undefined, to: custom ? eod(custom.to) : undefined };
  }
}

interface Props {
  value: WalletRangeKey;
  custom?: { from: Date; to: Date };
  onChange: (v: WalletRangeKey, custom?: { from: Date; to: Date }) => void;
}

export function WalletDateFilter({ value, custom, onChange }: Props) {
  const [range, setRange] = useState<DateRange | undefined>(
    custom ? { from: custom.from, to: custom.to } : undefined
  );

  const label = useMemo(() => {
    if (value === 'custom' && custom) {
      return `${format(custom.from, 'd MMM')} – ${format(custom.to, 'd MMM')}`;
    }
    return WALLET_RANGE_LABELS[value];
  }, [value, custom]);

  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            {label}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 bg-popover z-50">
          {PRESETS.map((k) => (
            <DropdownMenuItem
              key={k}
              onSelect={() => onChange(k)}
              className={cn('text-xs', value === k && 'font-semibold text-primary')}
            >
              {WALLET_RANGE_LABELS[k]}
            </DropdownMenuItem>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className={cn('text-xs', value === 'custom' && 'font-semibold text-primary')}
              >
                Custom Range…
              </DropdownMenuItem>
            </PopoverTrigger>
            <PopoverContent side="left" align="start" className="w-auto p-0 pointer-events-auto z-50">
              <Calendar
                mode="range"
                selected={range}
                onSelect={(r) => {
                  setRange(r);
                  if (r?.from && r?.to) onChange('custom', { from: r.from, to: r.to });
                }}
                numberOfMonths={1}
                className="pointer-events-auto p-3"
              />
            </PopoverContent>
          </Popover>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
