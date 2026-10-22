import { describe, it, expect } from 'vitest';
import { singleOrderPrice, singleOrderMarkedPrice, singleOrderValidation, servicePlatform, SINGLE_ORDER_MARKUP_PERCENT, INR_PER_USD } from '../../supabase/functions/_shared/single-order-policy';

describe('Single Order', () => {
  it('charges one quantity at the final per-1000 service price without extra markup', () => {
    expect(singleOrderPrice(2, 1500)).toBe(3);
    expect(singleOrderPrice(0.12345, 500)).toBe(0.0617);
  });
  it('shows the admin-entered INR price to users as-is (no extra markup)', () => {
    expect(SINGLE_ORDER_MARKUP_PERCENT).toBe(0);
    expect(singleOrderMarkedPrice(1.5)).toBe(1.5);
    expect(singleOrderPrice(singleOrderMarkedPrice(1.5), 1000)).toBe(1.5);
  });
  it('settles INR catalog prices into the USD wallet at the fixed rate', () => {
    expect(INR_PER_USD).toBe(83.5);
    expect(singleOrderPrice(singleOrderMarkedPrice(1.5) / INR_PER_USD, 1000)).toBeCloseTo(0.018, 3);
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