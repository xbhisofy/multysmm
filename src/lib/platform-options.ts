import { PLATFORM_CONFIG } from './engagement-types';
import { isManualAdsPlatform } from '../../supabase/functions/_shared/platform-policy';
export { isManualAdsPlatform } from '../../supabase/functions/_shared/platform-policy';

export function isAdsOrderSection(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.get('section') === 'ads' || isManualAdsPlatform(params.get('platform') || '');
}

export function orderPlatforms(platforms: string[], adsSection: boolean): string[] {
  return [...new Set(platforms)].filter(platform => isManualAdsPlatform(platform) === adsSection);
}

export function platformOptions(platforms: string[]) {
  return [...new Set([...Object.keys(PLATFORM_CONFIG), ...platforms])].map(key => ({
    key,
    label: PLATFORM_CONFIG[key as keyof typeof PLATFORM_CONFIG]?.label || key,
  }));
}