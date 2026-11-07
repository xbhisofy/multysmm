import { normalizeProviderOrderStatus, providerCount } from './provider-order-status.ts';

export async function syncSingleOrders(db: any, options: { userId?: string | null; orderId?: string | null } = {}) {
  let query = db.from('orders').select('id, user_id, status, provider_order_id, provider_account_id, dispatched_provider_id')
    .eq('is_organic_mode', false).not('provider_order_id', 'is', null)
    .in('status', ['pending', 'processing']).order('last_status_check', { ascending: true, nullsFirst: true }).limit(40);
  if (options.userId) query = query.eq('user_id', options.userId);
  if (options.orderId) query = query.eq('id', options.orderId);
  const { data: orders, error } = await query;
  if (error) throw error;
  let updated = 0; let unavailable = 0;
  const deadline = Date.now() + 18000;
  const accounts = new Map<string, any>();
  async function check(order: any) {
    if (Date.now() > deadline) { unavailable++; return; }
    const accountId = order.provider_account_id || order.dispatched_provider_id;
    if (!accountId || order.provider_order_id === 'unknown') {
      unavailable++;
      await db.from('orders').update({ last_status_check: new Date().toISOString() }).eq('id', order.id);
      return;
    }
    const table = order.provider_account_id ? 'provider_accounts' : 'providers';
    const key = `${table}:${accountId}`;
    if (!accounts.has(key)) {
      const { data } = await db.from(table).select('api_key, api_url').eq('id', accountId).maybeSingle();
      accounts.set(key, data);
    }
    const provider = accounts.get(key);
    if (!provider?.api_url || !provider.api_key) { unavailable++; return; }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(provider.api_url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ key: provider.api_key, action: 'status', order: order.provider_order_id }), signal: controller.signal });
      const result = await response.json();
      if (!response.ok || result.error) throw new Error('Provider status unavailable');
      const status = normalizeProviderOrderStatus(result.status);
      if (!status) throw new Error('Unknown provider status');
      const patch: Record<string, unknown> = { status, provider_status: String(result.status).slice(0, 100), last_status_check: new Date().toISOString(), updated_at: new Date().toISOString() };
      const start = providerCount(result.start_count); const remains = providerCount(result.remains);
      if (start !== null) patch.start_count = start;
      if (remains !== null) patch.remains = remains;
      if (status === 'completed') patch.remains = 0;
      const { error } = await db.from('orders').update(patch).eq('id', order.id).eq('user_id', order.user_id).in('status', ['pending', 'processing']);
      if (error) throw error;
      updated++;
    } catch { unavailable++; await db.from('orders').update({ last_status_check: new Date().toISOString() }).eq('id', order.id); }
    finally { clearTimeout(timer); }
  }
  for (let i = 0; i < (orders?.length || 0) && Date.now() < deadline; i += 5) await Promise.all(orders.slice(i, i + 5).map(check));
  return { updated, unavailable };
}