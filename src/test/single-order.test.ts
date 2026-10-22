import { describe, it, expect } from 'vitest';
import { singleOrderPrice, singleOrderValidation, servicePlatform } from '../../supabase/functions/_shared/single-order-policy';

describe('Single Order', () => {
  it('charges one quantity at the final per-1000 service price without extra markup', () => {
    expect(singleOrderPrice(2, 1500)).toBe(3);
    expect(singleOrderPrice(0.12345, 500)).toBe(0.0617);
  });
  it('requires a link and a whole quantity within the chosen service bounds', () => {
    expect(singleOrderValidation('https://instagram.com/p/example', 500, 500, 10000)).toBeNull();
    expect(singleOrderValidation('', 500, 500, 10000)).not.toBeNull();
    expect(singleOrderValidation('https://instagram.com/p/example', 499, 500, 10000)).not.toBeNull();
    expect(singleOrderValidation('https://instagram.com/p/example', 10001, 500, 10000)).not.toBeNull();
    expect(singleOrderValidation('https://instagram.com/p/example', 500.5, 500, 10000)).not.toBeNull();
  });
  it('filters imported social services by platform without needing bundles', () => {
    expect(servicePlatform('Instagram Views', 'Fast Views')).toBe('instagram');
    expect(servicePlatform('Other', 'TikTok Likes')).toBe('tiktok');
    expect(servicePlatform('Twitter/X', 'Followers')).toBe('twitter');
  });
});