# Scalability Optimization Plan

Aapki website ko lakhs of concurrent users + orders handle karne ke liye 4 layers pe optimize karenge. Main real slow-query data se problems identify kiye hain — assumptions nahi.

## What's actually slow right now (data-driven)

DB health se milla:
- `organic_run_schedule` pe ek query **132,369 baar** chali, total **357 seconds** — filter: `status = 'started' AND provider_account_id IS NOT NULL AND completed_at >= X`. Iska composite index nahi hai.
- Engagement orders + items + runs ka nested fetch **2263 baar**, **314 seconds** total, avg 139ms — over-fetches sab runs har order ke liye.
- `services` pe **415k seq scans**, `provider_accounts` pe **398k**, `popup_ads` pe **40k** — small tables hain but still worth guarding.
- **448,487 rolled-back transactions** since boot — matlab bahut contention ya failed writes. Wallet debit/credit RPCs pe row locks serialize ho rahe hain.
- Frontend: har dashboard page realtime channel open karta hai (`useWallet`, `useTransactions`, `useServices`, `useSubscription`, `EngagementOrder`, chat) — 100k concurrent users = 100k+ WebSocket subscriptions, backend crash guarantee.

---

## Phase 1 — Database indexes (biggest win, zero risk)

Ek migration me ye indexes add karenge:

```
-- Top offender: organic_run_schedule status+provider+completed
CREATE INDEX idx_ors_status_provider_completed
  ON organic_run_schedule (status, completed_at DESC)
  WHERE provider_account_id IS NOT NULL;

-- Pending runs scheduler (workers poll this constantly)
CREATE INDEX idx_ors_pending_scheduled
  ON organic_run_schedule (scheduled_at)
  WHERE status = 'pending';

-- Started runs status-poll cursor
CREATE INDEX idx_ors_started_lastcheck
  ON organic_run_schedule (last_status_check NULLS FIRST)
  WHERE status = 'started';

-- Rotation lock (unique constraint helps concurrent workers skip locked)
CREATE INDEX idx_ors_rotation_lock
  ON organic_run_schedule (rotation_lock_key)
  WHERE rotation_lock_key IS NOT NULL;

-- Item -> runs (join hotspot)
CREATE INDEX idx_ors_item_id
  ON organic_run_schedule (engagement_order_item_id);

-- Transactions user history (Wallet page)
CREATE INDEX idx_transactions_user_created
  ON transactions (user_id, created_at DESC);

-- Order lookups
CREATE INDEX idx_transactions_order
  ON transactions (order_id) WHERE order_id IS NOT NULL;

-- Provider accounts active lookup
CREATE INDEX idx_provider_accounts_active
  ON provider_accounts (provider_id, is_active) WHERE is_active = true;

-- Services active + category (services grid)
CREATE INDEX idx_services_active_category
  ON services (category, is_active) WHERE is_active = true;

-- Popup ads active + priority
CREATE INDEX idx_popup_ads_active
  ON popup_ads (is_active, priority DESC) WHERE is_active = true;

-- Health alerts open
-- (already exists as idx_ohalerts_open — skip)
```

Expected impact: top query 357s → sub-10s cumulative, dashboard loads 3-5x faster.

---

## Phase 2 — Query / RLS optimization

1. **Cap PostgREST embeds**: `EngagementOrder` list query embeds items + all runs. Change to fetch summary only (`items(id, status, quantity)` with `runs:organic_run_schedule(count)`) — detail page already fetches full runs on demand. Fixes the 314s query.

2. **Replace `select('*')`** in list views (`useTransactions`, `Orders`, admin lists) with explicit columns — reduces payload 40-60%.

3. **Add pagination** to `AdminAuditLog`, `AdminDeposits`, `Orders`, `EngagementOrder` history: `range(0, 24)` + infinite scroll. Currently pulling upto 1000 rows on mount.

4. **RLS hardening**: `has_role()` is called per-row on many policies. Confirm it's marked `STABLE` (yes) so PG caches per statement. Add `(select auth.uid())` wrapper pattern in policies that use `auth.uid() = user_id` — Supabase best practice to force initplan caching.

---

## Phase 3 — Realtime subscription cleanup

Currently every hook (`useWallet`, `useTransactions`, `useServices`, `useSubscription`) opens its own `postgres_changes` channel on mount. At 100k users = 400k+ channels.

Changes:
- **Kill realtime on read-heavy static tables**: `services`, `subscriptions`, `bundles`. Move to React Query with 30-60s `staleTime`.
- **Keep realtime only for**: `chat_messages` (active conversation), `wallets` (own row), `engagement_orders` (own active order detail page).
- **Filter server-side**: `.on('postgres_changes', { filter: 'user_id=eq.<uid>' })` — currently some channels listen to whole table.
- **Unsubscribe on unmount** — audit each hook.

---

## Phase 4 — Frontend performance

1. **Route-level code splitting**: convert heavy routes (admin panel, EngagementOrderDetail, Wallet charts) to `React.lazy()` + `Suspense`. Cuts initial bundle ~50%.
2. **React Query defaults**: set global `staleTime: 30_000`, `gcTime: 5*60_000`, disable `refetchOnWindowFocus` for non-critical queries.
3. **Memoize heavy components**: order tables, charts, provider grids with `React.memo` + `useMemo` for derived data.
4. **Virtualize long lists**: `AdminUsers`, `Orders`, `TypeHistoryTable` with `@tanstack/react-virtual` when >100 rows.
5. **Debounce search inputs** (services search, admin users search) — 300ms.

---

## Phase 5 — Cloud compute headroom

Currently: 22/240 connections, 6% RAM, 4% disk. Plenty of room *now*. Jab traffic grow ho:
- **Backend → Advanced Settings → Upgrade Instance** se DB size badhao (docs: cloud advanced settings).
- Data disk aur DB compute alag alag scale hote hain.

Ye phase user ke haath me — mai code side sab optimize kar dunga, aap sirf metrics dekh ke upgrade karna.

---

## Execution order

1. **Migration** with all indexes (Phase 1) — instant win, 1 turn.
2. **Query trim + pagination** in hot pages (Phase 2) — 2-3 turns.
3. **Realtime cleanup** (Phase 3) — 2 turns.
4. **Frontend split + memo + virtualization** (Phase 4) — 2-3 turns.

Total ~8-10 turns. Kuch bhi UI/feature nahi todega — sirf faster hoga.

## Confirm karo

Iss plan pe **"go"** bolo to Phase 1 abhi shuru karta hu. Ya koi phase skip / priority change karni ho to batao.
