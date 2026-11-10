import { describe, it, expect } from 'vitest';
import { bundleQuantityLimits, parseOptionalQuantity } from '../../supabase/functions/_shared/bundle-quantity-policy';

describe('Bundle quantity overrides', () => {
  it('lets a repost bundle set minimum 1 without changing single-order minimum 10', () => {
    const service = { min_quantity: 10, max_quantity: 1000 };
    expect(bundleQuantityLimits({ min_quantity_override: 1 }, service).minQuantity).toBe(1);
    expect(service.min_quantity).toBe(10);
  });
  it('uses provider limits when both optional overrides are blank', () => {
    expect(bundleQuantityLimits({ min_quantity_override: null, max_quantity_override: null }, { min_quantity: 1, max_quantity: 1000 })).toEqual({ minQuantity: 1, maxQuantity: 1000 });
    expect(parseOptionalQuantity('')).toBeNull();
  });
  it('applies an independently optional maximum', () => {
    expect(bundleQuantityLimits({ max_quantity_override: 50 }, { min_quantity: 1, max_quantity: 1000 })).toEqual({ minQuantity: 1, maxQuantity: 50 });
  });
  it('rejects zero, fractional and invalid limits', () => {
    for (const value of ['0', '1.5', 'bad']) expect(() => parseOptionalQuantity(value)).toThrow();
    expect(parseOptionalQuantity('1')).toBe(1);
  });
});