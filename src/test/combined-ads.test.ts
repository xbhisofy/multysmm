import { expect, it } from 'vitest';
import { DEFAULT_RATIOS, PLATFORM_ENGAGEMENT_TYPES } from '../lib/engagement-types';

it('uses the full base quantity once for the combined impressions/visits service', () => {
  expect(DEFAULT_RATIOS.impressions_visits).toBe(100);
  expect(Math.round(10000 * DEFAULT_RATIOS.impressions_visits / 100)).toBe(10000);
});

it('keeps separate ads types available for admin-created bundles', () => {
  expect(PLATFORM_ENGAGEMENT_TYPES.adsterra).toEqual(['impressions_visits', 'impressions', 'visits', 'clicks']);
});