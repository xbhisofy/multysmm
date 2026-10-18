import { PLATFORM_CONFIG } from './engagement-types';
export { isManualAdsPlatform } from '../../supabase/functions/_shared/platform-policy';

export function platformOptions(platforms: string[]) {
  return [...new Set([...Object.keys(PLATFORM_CONFIG), ...platforms])].map(key => ({
    key,
    label: PLATFORM_CONFIG[key as keyof typeof PLATFORM_CONFIG]?.label || key,
  }));
}