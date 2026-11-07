import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PlatformIcon } from '@/components/PlatformIcon';

type PickerOption = { value: string; label: string; number?: number | null; platform?: string };

export function ServicePicker({ id, value, options, onChange, disabled, placeholder }: {
  id: string; value: string; options: PickerOption[]; onChange: (value: string) => void; disabled?: boolean; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className="single-picker h-auto min-h-14 w-full justify-between text-left text-base font-medium">
        <span className="flex min-w-0 items-center gap-3">{selected?.platform && <PlatformIcon platform={selected.platform} />}<span className="min-w-0 truncate">{selected ? `${selected.number != null ? `${selected.number} - ` : ''}${selected.label}` : placeholder}</span></span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="order-picker-popup w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-2">
      <Command>
        <CommandInput aria-label={placeholder} placeholder="Search..." className="h-12 text-base" />
        <CommandList className="max-h-80">
          <CommandEmpty>No matches found.</CommandEmpty>
          <CommandGroup>{options.map(option => <CommandItem key={option.value} value={`${option.number ?? ''} ${option.label}`} onSelect={() => { onChange(option.value); setOpen(false); }} className="min-h-12 cursor-pointer items-start gap-2 px-3 py-4 text-base">
            {option.platform && <PlatformIcon platform={option.platform} />}
            {option.number != null && <span className="rounded-md bg-secondary px-2 py-1 text-xs font-bold text-primary">{option.number}</span>}
            <span className="min-w-0 flex-1 break-words">{option.label}</span>
            {option.value === value && <Check className="mt-1 h-4 w-4 shrink-0" />}
          </CommandItem>)}</CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
}