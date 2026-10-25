import { describe, it, expect } from 'vitest';
import { remainingPaidValue, providerCostInr, requiresNewFunding } from '../../supabase/functions/_shared/topup-policy';

describe('provider funding report', () => {
  it('uses historical paid value rather than todays catalog price', () => {
    expect(remainingPaidValue(1.5 / 83.5, 1000, 1000) * 83.5).toBeCloseTo(1.5);
    expect(remainingPaidValue(1, 1000, 500)).toBe(0.5);
    expect(remainingPaidValue(1, 1000, 2000)).toBe(1);
  });
  it('never asks to fund a pending run already sent to the provider', () => {
    expect(requiresNewFunding({ status: 'pending', provider_order_id: '21498698' })).toBe(false);
    expect(requiresNewFunding({ status: 'pending', provider_order_id: null })).toBe(true);
    expect(requiresNewFunding({ status: 'started', provider_order_id: null })).toBe(false);
  });
  it('calculates upstream cost with explicit currency, min quantity and delivery multiplier', () => {
    expect(providerCostInr(1.5, 'INR', 1000, 100, 1)).toBe(1.5);
    expect(providerCostInr(2, 'USD', 1000, 100, 1)).toBe(167);
    expect(providerCostInr(2, 'INR', 100, 200, 2)).toBe(0.4);
    expect(providerCostInr(2, 'EUR', 1000, 100, 1)).toBeNull();
  });
});