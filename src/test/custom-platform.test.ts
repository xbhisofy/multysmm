import { expect, it } from 'vitest';
import { isManualAdsPlatform } from '../../supabase/functions/_shared/platform-policy';
import { platformOptions } from '../lib/platform-options';
import { MANUAL_PLATFORMS, PLATFORM_ENGAGEMENT_TYPES } from '../lib/engagement-types';

it('offers Monetag immediately after Adsterra as a separate manual ads platform', () => {
  const options = platformOptions([]);
  const adsterraIndex = options.findIndex(p => p.key === 'adsterra');
  expect(options[adsterraIndex + 1]).toEqual({ key: 'monetag', label: 'Monetag' });
  expect(isManualAdsPlatform('monetag')).toBe(true);
  expect(MANUAL_PLATFORMS).toContain('monetag');
  expect(PLATFORM_ENGAGEMENT_TYPES.monetag).toEqual(['impressions_visits', 'impressions', 'visits', 'clicks']);
});

it('supports admin-named custom ad platforms with manual delivery', () => {
  expect(isManualAdsPlatform('Monitag')).toBe(true);
  expect(isManualAdsPlatform('My Ads Network')).toBe(true);
  expect(platformOptions(['My Ads Network']).find(p => p.key === 'My Ads Network')?.label).toBe('My Ads Network');
});
it('keeps existing social platform delivery unchanged', () => {
  expect(isManualAdsPlatform('instagram')).toBe(false);
  expect(isManualAdsPlatform('youtube')).toBe(false);
  expect(isManualAdsPlatform('adsterra')).toBe(true);
});