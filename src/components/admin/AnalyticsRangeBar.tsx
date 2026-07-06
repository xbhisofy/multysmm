import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { RANGE_LABELS, type RangeKey } from '@/lib/admin-analytics';

const PRESETS: RangeKey[] = [
  'today',
  'yesterday',
  'last7',
  'last30',
  'thisMonth',
  'lastMonth',
  'thisYear',
  'lifetime',
];

interface Props {
  value: RangeKey;
  custom?: { from: Date; to: Date };
  onChange: (v: RangeKey, custom?: { from: Date; to: Date }) => void;
  onRefresh: () => void;
  onExport: () => void;
  isFetching?: boolean;
}

export function AnalyticsRangeBar({ value, custom, onChange, onRefresh, onExport, isFetching }: Props) {
  const [range, setRange] = useState<DateRange | undefined>(
    custom ? { from: custom.from, to: custom.to } : undefined
  );

  return (
    <div className="glass-card p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
        {PRESETS.map((k) => (
          <Button
            key={k}
            size="sm"
            variant={value === k ? 'default' : 'outline'}
            className="h-8 text-xs px-2.5 rounded-full"
            onClick={() => onChange(k)}
          >
            {RANGE_LABELS[k]}
          </Button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant={value === 'custom' ? 'default' : 'outline'}
              className={cn('h-8 text-xs gap-1.5 px-2.5 rounded-full', value === 'custom' && 'font-semibold')}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {value === 'custom' && custom
                ? `${format(custom.from, 'd MMM')} – ${format(custom.to, 'd MMM')}`
                : 'Custom'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="end">
            <Calendar
              mode="range"
              selected={range}
              onSelect={(r) => {
                setRange(r);
                if (r?.from && r?.to) {
                  onChange('custom', { from: r.from, to: r.to });
                }
              }}
              numberOfMonths={2}
              className="pointer-events-auto p-3"
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center gap-1.5 sm:border-l sm:border-border/60 sm:pl-2 self-end sm:self-auto">
        <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={onRefresh} disabled={isFetching}>
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full" onClick={onExport}>
          <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">CSV</span>
        </Button>
      </div>
    </div>
  );
}
