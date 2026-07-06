import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { growth } from '@/lib/admin-analytics';

interface Props {
  label: string;
  value: string;
  icon?: React.ReactNode;
  current?: number;
  previous?: number;
  accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';
  hint?: string;
}

const ACCENTS: Record<NonNullable<Props['accent']>, string> = {
  primary: 'from-primary/20 to-primary/5 text-primary',
  success: 'from-success/20 to-success/5 text-success',
  warning: 'from-warning/20 to-warning/5 text-warning',
  destructive: 'from-destructive/20 to-destructive/5 text-destructive',
  muted: 'from-muted/40 to-muted/10 text-muted-foreground',
};

export function AnalyticsStatCard({
  label,
  value,
  icon,
  current,
  previous,
  accent = 'primary',
  hint,
}: Props) {
  const g = current !== undefined && previous !== undefined ? growth(current, previous) : null;

  return (
    <Card className="glass-card overflow-hidden h-full">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-medium line-clamp-1 flex-1 min-w-0">
            {label}
          </p>
          {icon && (
            <div
              className={cn(
                'w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0',
                ACCENTS[accent]
              )}
            >
              {icon}
            </div>
          )}
        </div>
        <p className="text-lg sm:text-xl lg:text-2xl font-bold tabular-nums mt-1.5 break-words leading-tight">
          {value}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {hint && <p className="text-[10px] text-muted-foreground line-clamp-1">{hint}</p>}
          {g && (
            <div
              className={cn(
                'inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded',
                g.dir === 'up' && 'text-success bg-success/10',
                g.dir === 'down' && 'text-destructive bg-destructive/10',
                g.dir === 'flat' && 'text-muted-foreground bg-muted/40'
              )}
            >
              {g.dir === 'up' && <ArrowUpRight className="h-2.5 w-2.5" />}
              {g.dir === 'down' && <ArrowDownRight className="h-2.5 w-2.5" />}
              {g.dir === 'flat' && <Minus className="h-2.5 w-2.5" />}
              {g.pct === null ? 'new' : `${g.pct > 0 ? '+' : ''}${g.pct.toFixed(1)}%`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
