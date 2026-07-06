# High-Level Performance Optimization Plan

Goal: sustain lakhs of users and orders without slowdowns. Backend is healthy (6% mem, 22/240 conns, 40 MB DB) — real bottlenecks are heavy nested reads and aggressive polling from the frontend. Fixes focus on cutting DB work per user, not adding hardware.

## Findings (from slow-query + pg_stat scan)

1. `EngagementOrders` list query = **#1 slowest** platform-wide (2655 calls, 163ms avg, 433s total). It embeds `items → runs` returning ~2500 rows per poll per user just to compute a progress bar.
2. `organic_run_schedule` polling for rotation state = **#2 slowest** (174k calls, 2ms avg, 363s total).
3. Static tables (`services`, `provider_accounts`, `bundles`) hit with hundreds of thousands of seq_scans — being re-fetched instead of cached.
4. `EngagementOrderDetail` polls every 5s even though realtime is already subscribed and debounces invalidations.

## Changes

### 1. Aggregate orders list via a single RPC (biggest win)
Add `public.get_user_engagement_orders_summary(p_user_id uuid, p_limit int)` (SECURITY DEFINER, indexed lookups) returning per order:
`id, order_number, status, total_price, link, base_quantity, created_at, updated_at, is_organic_mode, items_json` — where `items_json` is a compact jsonb array of `{id, engagement_type, quantity, status, total_runs, completed_runs, cancelled_runs, delivered_qty}` (aggregates only, no run rows).

Update `EngagementOrders.tsx` to call the RPC and derive progress from the aggregates instead of scanning `item.runs`. Response payload drops ~95%; query time expected < 20ms.

### 2. Slow the detail poll, trust realtime
`EngagementOrderDetail.tsx` already has a realtime subscription with 800ms debounce. Change the poll ladder from 5s / 10s / 15s → **20s / 30s / 60s**, and stop polling entirely once realtime has fired within the last 45s. Same UX, ~4× fewer DB hits.

### 3. Long-lived cache for static reference data
Bump per-query `staleTime` to 10 min and add `gcTime: 30 min` on the queries that read `services`, `engagement_bundles`, `providers`, `provider_accounts`, `platform_settings`, `template_settings` (if any left), and `subscription` plan lists. These change rarely; today they're re-fetched on every screen mount despite the global 5-min default (individual queries override it).

### 4. Targeted indexes only where a plan proves them missing
Existing indexes already cover the hot paths (user_id+created_at, status partial indexes, run scheduling). Skip speculative index adds. If EXPLAIN on the new RPC shows a seq scan we don't expect, add one composite index in a follow-up migration.

## Files touched
- `supabase/migrations/*` — one migration adding the RPC + grants to `authenticated`.
- `src/pages/EngagementOrders.tsx` — switch to `supabase.rpc(...)`, adjust progress calc to use aggregates.
- `src/pages/EngagementOrderDetail.tsx` — new poll ladder + realtime-aware pause.
- 2–3 hooks reading static tables — add `staleTime: 10*60*1000, gcTime: 30*60*1000`.

## Out of scope
- Compute upgrade (not needed at current load; Cloud instance is idle).
- Schema/table redesign, denormalization, or partitioning (premature at 40 MB DB size).
- Rewriting edge functions (none flagged in slow-query output).

Approve and I'll implement in one pass.