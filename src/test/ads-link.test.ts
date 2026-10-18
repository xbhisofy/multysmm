import { describe, it, expect } from 'vitest';
import { isValidAdsLink } from '../lib/ads-link';

describe('Ads order website links', () => {
  it('accepts any website domain including homepages and non-Adsterra links', () => {
    for (const link of ['https://example.com', 'https://monitag.com/path?q=1', 'https://other-site.in/', 'https://instagram.com/post/123', 'http://news.example.org/article']) {
      expect(isValidAdsLink(link)).toBe(true);
    }
  });
  it('rejects malformed links and non-web protocols', () => {
    for (const link of ['', 'random text', 'example.com', 'javascript:alert(1)', 'ftp://example.com', 'https://', 'https://bad domain.com']) {
      expect(isValidAdsLink(link)).toBe(false);
    }
  });
});