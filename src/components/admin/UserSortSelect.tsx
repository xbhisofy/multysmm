import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';
import { SORT_OPTIONS, type SortKey } from '@/lib/admin-users-filters';

export function UserSortSelect({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
      <SelectTrigger className="h-10 rounded-xl min-w-[220px] gap-2">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-[70vh]">
        {SORT_OPTIONS.map(o => (
          <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
