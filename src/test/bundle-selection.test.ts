import { expect, it } from 'vitest';
import { chooseBundle, platformBundles } from '../lib/bundle-selection';

const bundles = [
  { id: 'secondary', platform: 'instagram', sort_order: 2, is_active: true, price: 9, service: 'own-provider' },
  { id: 'primary', platform: 'instagram', sort_order: 0, is_active: true, price: 1, service: 'main-provider' },
  { id: 'tiktok-primary', platform: 'tiktok', sort_order: 0, is_active: true, price: 3, service: 'tiktok-provider' },
];
it('defaults to the primary bundle for each platform', () => {
  expect(chooseBundle(bundles, 'instagram')?.id).toBe('primary');
  expect(chooseBundle(bundles, 'tiktok')?.id).toBe('tiktok-primary');
});
it('uses the explicitly selected secondary bundle and its own price/provider', () => {
  expect(chooseBundle(bundles, 'instagram', 'secondary')).toMatchObject({ id: 'secondary', price: 9, service: 'own-provider' });
});
it('does not reuse the previous platform bundle', () => {
  expect(chooseBundle(bundles, 'tiktok', 'secondary')?.id).toBe('tiktok-primary');
});
it('supports any number of active secondary bundles and excludes inactive ones', () => {
  const extra = Array.from({ length: 5 }, (_, i) => ({ ...bundles[0], id: `extra-${i}`, sort_order: i + 3 }));
  expect(platformBundles([...bundles, ...extra, { ...bundles[0], id: 'hidden', is_active: false }], 'instagram')).toHaveLength(7);
});