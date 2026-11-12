import { describe, expect, it } from 'vitest';
import { providerRefreshFields, bundlePriceFromInr } from '../../supabase/functions/_shared/service-price-policy';

describe('admin price retention', () => {
  it('keeps a raised admin price when provider refresh returns a lower cost', () => {
    const current = { price: 50, name: 'Old service' };
    expect({ ...current, ...providerRefreshFields({ price: 1.36, name: 'Fresh service' }) }).toEqual({ price: 50, name: 'Fresh service' });
  });
  it('also preserves an intentional admin price decrease during re-import', () => {
    expect({ price: 2, ...providerRefreshFields({ price: 100 }) }.price).toBe(2);
  });
  it('retains the entered bundle INR price through storage conversion', () => {
    expect(Number(((bundlePriceFromInr('50', 83.5) ?? 0) * 83.5).toFixed(2))).toBe(50);
  });
  it('only explicitly blank bundle prices restore automatic pricing', () => {
    expect(bundlePriceFromInr('', 83.5)).toBeNull();
    expect(() => bundlePriceFromInr('0', 83.5)).toThrow();
    expect(() => bundlePriceFromInr('-1', 83.5)).toThrow();
  });
});