import { afterEach, expect, it, vi } from 'vitest';
import { syncSingleOrders } from '../../supabase/functions/_shared/sync-single-orders';
afterEach(() => vi.unstubAllGlobals());
it('reads the dispatched account and writes its Completed status without payment writes', async () => {
  const writes: { table: string; patch: any }[] = [];
  const order = { id: 'order-a', user_id: 'owner-a', status: 'processing', provider_order_id: '123', provider_account_id: 'actual-account' };
  const db = { from(table: string) {
    const chain: any = { select: () => chain, eq: () => chain, not: () => chain, in: () => chain, order: () => chain, limit: () => chain,
      update: (patch: any) => { writes.push({ table, patch }); return chain; },
      maybeSingle: async () => ({ data: { api_url: 'https://provider.test/api', api_key: 'test-only' } }),
      then: (resolve: any) => resolve({ data: [order], error: null }) };
    return chain;
  } };
  const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ status: 'Completed', remains: '0', start_count: '12' }) }));
  vi.stubGlobal('fetch', fetch);
  expect(await syncSingleOrders(db, { userId: 'owner-a' })).toEqual({ updated: 1, unavailable: 0 });
  expect(fetch.mock.calls[0][0]).toBe('https://provider.test/api');
  expect(writes).toHaveLength(1);
  expect(writes[0].table).toBe('orders');
  expect(writes[0].patch.status).toBe('completed');
  expect(writes[0].patch.remains).toBe(0);
  expect(writes[0].patch.start_count).toBe(12);
});