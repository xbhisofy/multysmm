
CREATE INDEX IF NOT EXISTS idx_ors_status_provider_completed
  ON public.organic_run_schedule (status, completed_at DESC)
  WHERE provider_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ors_pending_scheduled
  ON public.organic_run_schedule (scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_ors_started_lastcheck
  ON public.organic_run_schedule (last_status_check NULLS FIRST)
  WHERE status = 'started';

CREATE INDEX IF NOT EXISTS idx_ors_rotation_lock
  ON public.organic_run_schedule (rotation_lock_key)
  WHERE rotation_lock_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ors_item_id
  ON public.organic_run_schedule (engagement_order_item_id);

CREATE INDEX IF NOT EXISTS idx_ors_order_id
  ON public.organic_run_schedule (order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_user_created
  ON public.transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_order
  ON public.transactions (order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_provider_accounts_active
  ON public.provider_accounts (provider_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_services_active_category
  ON public.services (category, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_popup_ads_enabled
  ON public.popup_ads (enabled)
  WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_spm_service_active
  ON public.service_provider_mapping (service_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_eoi_status
  ON public.engagement_order_items (status)
  WHERE status IN ('pending','processing');

CREATE INDEX IF NOT EXISTS idx_orders_active_status
  ON public.orders (status, created_at DESC)
  WHERE status IN ('pending','processing');

ANALYZE public.organic_run_schedule;
ANALYZE public.transactions;
ANALYZE public.engagement_orders;
ANALYZE public.engagement_order_items;
ANALYZE public.services;
ANALYZE public.provider_accounts;
ANALYZE public.popup_ads;
