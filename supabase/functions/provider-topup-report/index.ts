import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { providerCostInr, remainingPaidValue, requiresNewFunding, REPORT_INR_PER_USD } from '../_shared/topup-policy.ts';

Deno.serve(async (req) => {
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'POST required' }, 405);
  try {
    const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const token = req.headers.get('Authorization')?.replace(/^Bearer /, '');
    if (!token) return reply({ error: 'Unauthorized' }, 401);
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return reply({ error: 'Unauthorized' }, 401);
    const { data: roles, error: roleError } = await db.from('user_roles').select('role').eq('user_id', auth.user.id);
    if (roleError || !roles?.some(r => r.role === 'admin')) return reply({ error: 'Admin access required' }, 403);
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length) return reply({ error: 'Expected empty object' }, 400);
    const load = async (table: string, columns: string, filter?: string) => {
      const rows: any[] = [];
      for (let offset = 0; ; offset += 1000) {
        let query = db.from(table).select(columns).order('id').range(offset, offset + 999);
        if (filter) query = query.eq('status', filter);
        const { data, error } = await query;
        if (error) throw new Error(`Unable to read ${table}`);
        rows.push(...(data ?? []));
        if (!data || data.length < 1000) return rows;
      }
    };
    const [runs, items, orders, engagementOrders, services, accounts, mappings, profiles, wallets] = await Promise.all([
      load('organic_run_schedule', 'id,order_id,engagement_order_item_id,quantity_to_send,status,provider_order_id,provider_account_id', 'pending'),
      load('engagement_order_items', 'id,engagement_order_id,service_id,quantity,price,status'),
      load('orders', 'id,user_id,service_id,quantity,price,status'),
      load('engagement_orders', 'id,user_id,status'),
      load('services', 'id,provider_id,provider_service_id,name,category'),
      load('provider_accounts', 'id,provider_id,name,api_url,api_key,priority,is_active,balance,balance_currency,delivery_multiplier'),
      load('service_provider_mapping', 'id,service_id,provider_account_id,provider_service_id,sort_order,is_active'),
      load('profiles', 'id,user_id,email,full_name'), load('wallets', 'id,user_id,balance,total_deposited,total_spent'),
    ]);
    // No keys or upstream payloads leave this function. API calls only read balance/services.
    const catalogs = new Map<string, { currency: string; rates: Map<string, any>; balance: number }>();
    await Promise.all(accounts.filter(a => a.is_active).map(async a => {
      try {
        const call = async (action: string) => {
          const response = await fetch(a.api_url, { method: 'POST', body: new URLSearchParams({ key: a.api_key, action }), signal: AbortSignal.timeout(12000) });
          if (!response.ok) throw new Error('Provider unavailable');
          return response.json();
        };
        const [list, balance] = await Promise.all([call('services'), call('balance')]);
        if (!Array.isArray(list) || !balance.currency || !Number.isFinite(Number(balance.balance))) return;
        catalogs.set(a.id, { currency: String(balance.currency), balance: Number(balance.balance), rates: new Map(list.map(s => [String(s.service), s])) });
      } catch { /* Unknown costs remain explicitly unpriced; never use retail prices as a fallback. */ }
    }));
    const byId = (rows: any[]) => new Map(rows.map(r => [r.id, r]));
    const itemMap = byId(items), orderMap = byId(orders), eoMap = byId(engagementOrders), serviceMap = byId(services), accountMap = byId(accounts);
    const groups = new Map<string, any>();
    const breakdown = new Map<string, any>();
    const paidGroups = new Map<string, any>();
    const add = (serviceId: string, quantity: number, paid: any, assigned?: string | null) => {
      const service = serviceMap.get(serviceId);
      const choices = mappings.filter(m => m.service_id === serviceId && m.is_active && accountMap.get(m.provider_account_id)?.is_active)
        .sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (accountMap.get(a.provider_account_id)?.priority ?? 0) - (accountMap.get(b.provider_account_id)?.priority ?? 0));
      const mapping = choices.find(m => m.provider_account_id === assigned) ?? choices[0];
      const account = (assigned && accountMap.get(assigned)) || (mapping && accountMap.get(mapping.provider_account_id)) || accounts.find(a => a.is_active && a.provider_id === service?.provider_id);
      const id = account?.provider_id ?? 'unassigned';
      const group = groups.get(id) ?? { provider_id: id, provider_name: account?.name ?? 'Unassigned', pending_runs: 0, cost_inr: 0, balance_inr: 0, unknown_runs: 0 };
      const catalog = account && catalogs.get(account.id);
      const providerServiceId = mapping?.provider_account_id === account?.id ? mapping.provider_service_id : service?.provider_service_id;
      const rate = catalog?.rates.get(String(providerServiceId));
      const cost = rate && catalog ? providerCostInr(Number(rate.rate), catalog.currency, quantity, Number(rate.min) || 0, Number(account?.delivery_multiplier) || 1) : null;
      group.pending_runs++;
      if (cost === null) group.unknown_runs++; else group.cost_inr += cost;
      groups.set(id, group);
      const key = `${id}:${serviceId}`;
      const detail = breakdown.get(key) ?? { provider_id: id, service_id: serviceId, service_name: service?.name ?? 'Unknown service', pending_quantity: 0, pending_runs: 0 };
      detail.pending_quantity += quantity; detail.pending_runs++; breakdown.set(key, detail);
      const paidGroup = paidGroups.get(paid.key) ?? { ...paid, pendingQuantity: 0 };
      paidGroup.pendingQuantity += quantity; paidGroups.set(paid.key, paidGroup);
    };
    const active = (status: string) => ['pending','processing','in_progress','queued'].includes(status);
    for (const run of runs) {
      if (!requiresNewFunding(run)) continue;
      const item = itemMap.get(run.engagement_order_item_id), order = orderMap.get(run.order_id);
      const parent = item ? eoMap.get(item.engagement_order_id) : order;
      if (!parent || !active(parent.status) || (item && !active(item.status))) continue;
      const target = item ?? order;
      if (!target) continue;
      add(target.service_id, Number(run.quantity_to_send), { key: target.id, orderKey: parent.id, userId: parent.user_id, price: Number(target.price), quantity: Number(target.quantity) }, run.provider_account_id);
    }
    // Distinguish genuinely unscheduled orders from orders with completed/started schedules.
    const activeOrders = orders.filter(o => active(o.status));
    for (let offset = 0; offset < activeOrders.length; offset += 100) {
      const batch = activeOrders.slice(offset, offset + 100);
      const { data: scheduled, error } = await db.from('organic_run_schedule').select('order_id').in('order_id', batch.map(o => o.id));
      if (error) throw new Error('Unable to read order schedules');
      const ids = new Set(scheduled?.map(r => r.order_id));
      for (const o of batch) if (!ids.has(o.id)) add(o.service_id, Number(o.quantity), { key: o.id, orderKey: o.id, userId: o.user_id, price: Number(o.price), quantity: Number(o.quantity) });
    }
    for (const account of accounts.filter(a => a.is_active)) {
      const catalog = catalogs.get(account.id);
      const balance = catalog ? providerCostInr(catalog.balance, catalog.currency, 1000, 0, 1) : null;
      const group = groups.get(account.provider_id) ?? { provider_id: account.provider_id, provider_name: account.name, pending_runs: 0, cost_inr: 0, balance_inr: 0, unknown_runs: 0 };
      group.balance_inr += balance ?? 0;
      if (balance === null) group.balance_unknown = true;
      groups.set(account.provider_id, group);
    }
    const users = new Map<string, any>();
    for (const paid of paidGroups.values()) {
      const user = users.get(paid.userId) ?? { user_id: paid.userId, pending_value_usd: 0, orderIds: new Set() };
      user.pending_value_usd += remainingPaidValue(paid.price, paid.quantity, paid.pendingQuantity);
      user.orderIds.add(paid.orderKey); users.set(paid.userId, user);
    }
    return reply({ generated_at: new Date().toISOString(), providers: [...groups.values()], breakdown: [...breakdown.values()], top_users: [...users.values()].sort((a,b) => b.pending_value_usd - a.pending_value_usd).slice(0,5).map(u => {
      const profile = profiles.find(p => p.user_id === u.user_id), wallet = wallets.find(w => w.user_id === u.user_id);
      return { user_id: u.user_id, email: profile?.email ?? '', full_name: profile?.full_name ?? '', pending_orders: u.orderIds.size, pending_value_inr: u.pending_value_usd * REPORT_INR_PER_USD, wallet_inr: Number(wallet?.balance ?? 0) * REPORT_INR_PER_USD, spent_inr: Number(wallet?.total_spent ?? 0) * REPORT_INR_PER_USD };
    }) });
  } catch { return reply({ error: 'Unable to generate provider report. Please retry.' }, 500); }
});