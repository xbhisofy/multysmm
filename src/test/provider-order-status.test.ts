import { describe, expect, it } from 'vitest';
import { normalizeProviderOrderStatus, providerCount, canRefreshOrder } from '../../supabase/functions/_shared/provider-order-status';
describe('provider Single Order status', () => {
  it('matches Processing without inferring completion from zero remains', () => { expect(normalizeProviderOrderStatus('Processing')).toBe('processing'); expect(normalizeProviderOrderStatus(' In progress ')).toBe('processing'); });
  it('matches provider Completed', () => { expect(normalizeProviderOrderStatus('Completed')).toBe('completed'); });
  it('matches provider Cancelled and Canceled', () => { expect(normalizeProviderOrderStatus('Cancelled')).toBe('cancelled'); expect(normalizeProviderOrderStatus('Canceled')).toBe('cancelled'); });
  it('preserves partial and failure statuses', () => { expect(normalizeProviderOrderStatus('Partial')).toBe('partial'); expect(normalizeProviderOrderStatus('Error')).toBe('failed'); });
  it('does not invent unknown statuses or missing counts', () => { expect(normalizeProviderOrderStatus('maintenance')).toBeNull(); expect(providerCount(undefined)).toBeNull(); expect(providerCount('0')).toBe(0); expect(providerCount('invalid')).toBeNull(); });
  it('prevents a member refreshing another member order', () => { expect(canRefreshOrder('user-a', 'user-b', false)).toBe(false); expect(canRefreshOrder('user-a', 'user-a', false)).toBe(true); expect(canRefreshOrder(null, 'user-a', false)).toBe(false); });
});