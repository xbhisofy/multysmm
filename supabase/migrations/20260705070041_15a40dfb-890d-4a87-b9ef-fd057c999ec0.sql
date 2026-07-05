-- 1) engagement_bundles: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active bundles" ON public.engagement_bundles;
CREATE POLICY "Authenticated can view active bundles"
  ON public.engagement_bundles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

REVOKE SELECT ON public.engagement_bundles FROM anon;

-- 2) bundle_items: only expose items belonging to active bundles, to authenticated users
DROP POLICY IF EXISTS "Authenticated users can view bundle items" ON public.bundle_items;
CREATE POLICY "Authenticated can view active bundle items"
  ON public.bundle_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.engagement_bundles b
      WHERE b.id = bundle_items.bundle_id AND b.is_active = true
    )
  );

REVOKE SELECT ON public.bundle_items FROM anon;

-- 3) popup_ads: only expose currently live ads to the public
DROP POLICY IF EXISTS "popup_ads public read" ON public.popup_ads;
CREATE POLICY "popup_ads live read"
  ON public.popup_ads
  FOR SELECT
  USING (
    enabled = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

-- 4) SECURITY DEFINER functions: revoke public/authenticated execute on admin/backend-only routines
--    Keep executable for authenticated ONLY where the function is legitimately called from user context.

-- Backend/service-role only (never called from client):
REVOKE ALL ON FUNCTION public.credit_wallet_zapupi(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.credit_wallet_oxapay(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.debit_wallet_for_order(uuid, numeric, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_adjust_wallet(uuid, text, numeric, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_zapupi_fraud_strike(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_completed_engagement_orders() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pg_advisory_xact_lock(bigint) FROM PUBLIC, anon, authenticated;

-- Admin-only RPCs (has internal has_role check, but also lock down at grant layer):
REVOKE ALL ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_users_summary() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_provider_topup_plan() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_provider_topup_breakdown() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_top_pending_users(integer) FROM PUBLIC, anon;

-- Trigger-only helpers (never RPC): revoke from all API roles
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_wallet_credit_trail() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_transaction_provenance() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_zapupi_deposit_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_oxapay_deposit_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_pending_runs_on_item_cancel() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_pending_runs_on_eo_cancel() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_engagement_order_completed_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.engagement_orders_lock_user_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.engagement_order_items_lock_user_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.organic_run_schedule_lock_user_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.compute_rotation_lock_key() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_conversation_last_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_user_subscription() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Client-callable RPCs (authorization enforced inside function) — keep authenticated execute, revoke anon
REVOKE ALL ON FUNCTION public.cancel_order_with_refund(uuid, uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reschedule_organic_run(uuid, integer, timestamptz) FROM PUBLIC, anon;

-- Utility SQL helpers used by RLS / UI (safe, read-only, no auth check needed) — keep as-is for authenticated, revoke anon
REVOKE ALL ON FUNCTION public.is_maintenance_mode() FROM anon;
REVOKE ALL ON FUNCTION public.get_public_markup() FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM anon;
