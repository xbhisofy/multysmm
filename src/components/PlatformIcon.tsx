import { Globe, Linkedin } from 'lucide-react';
import { siInstagram, siTiktok, siFacebook, siX, siYoutube, siTelegram, siSpotify } from 'simple-icons';
import { cn } from '@/lib/utils';

const symbols: Record<string, { path: string }> = { instagram: siInstagram, tiktok: siTiktok, facebook: siFacebook, twitter: siX, youtube: siYoutube, telegram: siTelegram, spotify: siSpotify };

export function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const symbol = symbols[platform];
  return <span aria-hidden="true" data-platform={platform} className={cn('platform-brand-icon', className)}>
    {symbol ? <svg viewBox="0 0 24 24" fill="currentColor"><path d={symbol.path} /></svg> : platform === 'linkedin' ? <Linkedin /> : <Globe />}
  </span>;
}