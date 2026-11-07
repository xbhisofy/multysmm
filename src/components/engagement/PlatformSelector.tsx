import { cn } from "@/lib/utils";
import { platformOptions } from '@/lib/platform-options';
import { Button } from '@/components/ui/button';
import { PlatformIcon } from '@/components/PlatformIcon';

interface PlatformSelectorProps {
  selected: string;
  onSelect: (platform: string) => void;
  availablePlatforms?: string[]; // Only show platforms with active bundles
}

export function PlatformSelector({ selected, onSelect, availablePlatforms }: PlatformSelectorProps) {
  // Filter platforms based on availablePlatforms prop
  const platformsToShow = platformOptions(availablePlatforms || [])
    .filter(option => !availablePlatforms || availablePlatforms.includes(option.key));

  if (platformsToShow.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No platforms configured. Contact admin to set up engagement bundles.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {platformsToShow.map(({key, label}) => {
        const isSelected = selected === key;

        return (
          <Button
            variant="ghost"
            key={key}
            aria-pressed={isSelected}
            onClick={() => onSelect(key)}
            className={cn(
              "group relative flex items-center gap-2 h-11 pl-1.5 pr-3 rounded-full font-bold text-xs uppercase transition-all duration-200",
              isSelected
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-md ring-1 ring-border'
                : "bg-secondary/60 text-muted-foreground border border-border/60 hover:text-foreground hover:border-border"
            )}
          >
            <PlatformIcon platform={key} />
            <span>{label}</span>
            {isSelected && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary-foreground ring-2 ring-background" />
            )}
          </Button>
        );
      })}
    </div>
  );
}
