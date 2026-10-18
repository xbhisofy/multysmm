import { cn } from "@/lib/utils";
import { PLATFORM_CONFIG } from "@/lib/engagement-types";
import { platformOptions } from '@/lib/platform-options';
import { Button } from '@/components/ui/button';
import { Instagram, Music, Youtube, Twitter, Facebook, Megaphone } from "lucide-react";

interface PlatformSelectorProps {
  selected: string;
  onSelect: (platform: string) => void;
  availablePlatforms?: string[]; // Only show platforms with active bundles
}

const iconMap = {
  Instagram,
  Music,
  Youtube,
  Twitter,
  Facebook,
  Megaphone,
};

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
        const config = PLATFORM_CONFIG[key as keyof typeof PLATFORM_CONFIG];
        const Icon = config ? iconMap[config.icon as keyof typeof iconMap] : Megaphone;
        const isSelected = selected === key;

        return (
          <Button
            variant="ghost"
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              "group relative flex items-center gap-1.5 h-8 pl-1 pr-2.5 rounded-full font-bold text-[10px] uppercase transition-all duration-200",
              isSelected
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-md ring-1 ring-border'
                : "bg-secondary/60 text-muted-foreground border border-border/60 hover:text-foreground hover:border-border"
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center h-6 w-6 rounded-full shrink-0",
                isSelected
                  ? "bg-primary-foreground/20"
                  : "bg-foreground/5"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-primary-foreground" : "text-muted-foreground")} />
            </span>
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
