-- 1. Fast lookup: recent completed runs per provider (used by admin dashboards / provider report)
CREATE INDEX IF NOT EXISTS idx_ors_provider_status_completed
  ON public.organic_run_schedule (provider_account_id, status, completed_at DESC)
  WHERE provider_account_id IS NOT NULL;

-- 2. Pending run scan sort key (last_status_check NULLS FIRST, scheduled_at) — cron every 1-2 min
CREATE INDEX IF NOT EXISTS idx_ors_pending_scan_order
  ON public.organic_run_schedule (last_status_check NULLS FIRST, scheduled_at)
  WHERE status = 'pending';

-- 3. Provider-specific started runs by started_at DESC (order status polling)
CREATE INDEX IF NOT EXISTS idx_ors_provider_started
  ON public.organic_run_schedule (provider_account_id, started_at DESC)
  WHERE provider_order_id IS NOT NULL;

-- 4. Failed retry pickup (ordered by completed_at ASC)
CREATE INDEX IF NOT EXISTS idx_ors_failed_retry
  ON public.organic_run_schedule (completed_at ASC)
  WHERE status = 'failed';

-- 5. engagement_orders lookup by order_number (order detail page — 42k+ calls, no index)
CREATE INDEX IF NOT EXISTS idx_engagement_orders_order_number
  ON public.engagement_orders (order_number);

-- 6. Drop duplicate index on engagement_orders (user_id, created_at DESC) — 2 identical indexes exist
DROP INDEX IF EXISTS public.idx_engagement_orders_user_created;
