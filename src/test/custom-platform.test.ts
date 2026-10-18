import { expect, it } from 'vitest';
import { isManualAdsPlatform } from '../../supabase/functions/_shared/platform-policy';
import { platformOptions } from '../lib/platform-options';

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