import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PlatformIcon } from '@/components/PlatformIcon';

type PickerOption = { value: string; label: string; number?: number | null; platform?: string };

export function ServicePicker({ id, value, options, onChange, disabled, placeholder }: {
  id: string; value: string; options: PickerOption[]; onChange: (value: string) => void; disabled?: boolean; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className="single-picker h-auto min-h-14 w-full justify-between rounded-3xl border border-primary/15 bg-primary/5 px-5 text-left text-base font-medium shadow-none hover:bg-primary/10">
        <span className="flex min-w-0 items-center gap-3">{selected?.platform && <PlatformIcon platform={selected.platform} />}<span className="min-w-0 truncate">{selected ? <>{selected.number != null && <span className="font-extrabold text-primary">{selected.number}</span>}{selected.number != null ? ' - ' : ''}{selected.label}</> : placeholder}</span></span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="order-picker-popup w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] rounded-2xl p-2">
      <div className="max-h-96 overflow-y-auto overscroll-contain">
        {options.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted-foreground">No matches found.</p>}
        {options.map(option => {
          const isSelected = option.value === value;
          return <button
            key={option.value}
            type="button"
            onClick={() => { onChange(option.value); setOpen(false); }}
            className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3.5 text-left text-[15px] transition-colors ${isSelected ? 'bg-primary/10 font-semibold' : 'hover:bg-primary/5'}`}
          >
            <span className="flex w-5 shrink-0 items-center justify-center">{isSelected && <Check className="h-4 w-4 text-primary" />}</span>
            {option.platform && <PlatformIcon platform={option.platform} />}
            <span className="min-w-0 flex-1 break-words">
              {option.number != null && <span className="font-extrabold text-primary">{option.number}</span>}
              {option.number != null && ' - '}
              {option.label}
            </span>
          </button>;
        })}
      </div>
    </PopoverContent>
  </Popover>;
}
