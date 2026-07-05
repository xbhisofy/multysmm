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
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">
              {label}
            </p>
            <p className="text-xl sm:text-2xl font-bold tabular-nums mt-1 truncate">{value}</p>
            {hint && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{hint}</p>}
          </div>
          {icon && (
            <div
              className={cn(
                'w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0',
                ACCENTS[accent]
              )}
            >
              {icon}
            </div>
          )}
        </div>
        {g && (
          <div
            className={cn(
              'mt-2 inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded',
              g.dir === 'up' && 'text-success bg-success/10',
              g.dir === 'down' && 'text-destructive bg-destructive/10',
              g.dir === 'flat' && 'text-muted-foreground bg-muted/40'
            )}
          >
            {g.dir === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {g.dir === 'down' && <ArrowDownRight className="h-3 w-3" />}
            {g.dir === 'flat' && <Minus className="h-3 w-3" />}
            {g.pct === null ? 'new' : `${g.pct > 0 ? '+' : ''}${g.pct.toFixed(1)}%`}
            <span className="text-muted-foreground font-normal ml-0.5">vs prev</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
