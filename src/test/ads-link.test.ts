import { describe, it, expect } from 'vitest';
import { isValidAdsLink } from '../lib/ads-link';

describe('Ads order links', () => {
  it('accepts any non-empty text or link', () => {
    for (const link of ['https://example.com', 'example.com', 'random text', 'monetag.com/abc']) {
      expect(isValidAdsLink(link)).toBe(true);
    }
  });
  it('rejects only empty input', () => {
    expect(isValidAdsLink('   ')).toBe(false);
  });
});
