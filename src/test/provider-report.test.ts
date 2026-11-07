import { expect, it } from 'vitest';
import { generateProviderTopupReport } from '../../supabase/functions/_shared/provider-topup-report';

it('keeps unmapped pending services unpriced without crashing the whole report', async () => {
  const rows: Record<string, unknown[]> = {
    organic_run_schedule: [{ id: 'run', order_id: 'order', quantity_to_send: 100, status: 'pending', provider_order_id: null }],
    orders: [{ id: 'order', user_id: 'user', service_id: 'missing', quantity: 100, price: 1, status: 'pending' }],
  };
  const db = { from(table: string) {
    const query: any = {
      select: () => query, order: () => query, range: () => query, eq: () => query, in: () => query,
      then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: rows[table] ?? [], error: null }).then(resolve),
    };
    return query;
  } };
  const report = await generateProviderTopupReport(db);
  expect(report.providers[0].unknown_runs).toBe(1);
  expect(report.providers[0].cost_inr).toBe(0);
  expect(report.providers[0].provider_id).toBe('unassigned');
});