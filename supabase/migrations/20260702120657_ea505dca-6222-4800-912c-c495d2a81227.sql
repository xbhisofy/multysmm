
-- =========================================================
-- 1) services.provider_id — restrict public exposure
--    Change SELECT policy from PUBLIC to authenticated only,
--    and revoke the sensitive columns from anon.
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Authenticated users can view active services"
  ON public.services
  FOR SELECT
  TO authenticated
  USING (is_active = true);

REVOKE SELECT ON public.services FROM anon;

-- =========================================================
-- 2) zapupi_webhook_events — add explicit service-role only policy
--    (RLS was already default-deny; this makes intent explicit.)
-- =========================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='zapupi_webhook_events' AND policyname='Service role only'
  ) THEN
    EXECUTE $p$CREATE POLICY "Service role only" ON public.zapupi_webhook_events
      FOR ALL TO service_role USING (true) WITH CHECK (true)$p$;
  END IF;
END $$;

-- =========================================================
-- 3) deposits — document that INSERT is server-side only
--    (No client INSERT policy on purpose; ZapUPI/admin only.)
-- =========================================================
COMMENT ON TABLE public.deposits IS
  'Deposits are created server-side only (ZapUPI edge functions / admin RPC). No client INSERT policy on purpose.';

-- =========================================================
-- 4) SECURITY DEFINER functions — revoke public/anon/authenticated
--    EXECUTE from functions that are NOT meant to be called
--    directly from the client. Trigger functions and admin/
--    service-only functions are locked down. User-callable
--    functions (has_role, get_user_role, get_public_markup,
--    is_maintenance_mode, reschedule_organic_run,
--    get_admin_dashboard_stats and other admin RPCs that
--    check has_role() internally) keep authenticated EXECUTE.
-- =========================================================

-- --- Trigger functions: no direct call needed ---
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_user_subscription() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_wallet_credit_trail() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.engagement_orders_lock_user_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_pending_runs_on_eo_cancel() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_pending_runs_on_item_cancel() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_engagement_order_completed_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_conversation_last_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.organic_run_schedule_lock_user_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.compute_rotation_lock_key() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.engagement_order_items_lock_user_columns() FROM PUBLIC, anon, authenticated;

-- --- Service-role only (called by edge functions with service key) ---
REVOKE ALL ON FUNCTION public.admin_adjust_wallet(uuid, text, numeric, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.credit_wallet_zapupi(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.debit_wallet_for_order(uuid, numeric, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_zapupi_fraud_strike(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_order_with_refund(uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pg_advisory_xact_lock(bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_completed_engagement_orders() FROM PUBLIC, anon, authenticated;

-- --- Admin RPCs with internal has_role() check: revoke anon, keep authenticated ---
REVOKE ALL ON FUNCTION public.get_admin_users_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_users_summary() TO authenticated;

REVOKE ALL ON FUNCTION public.get_provider_topup_breakdown() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_breakdown() TO authenticated;

REVOKE ALL ON FUNCTION public.get_provider_topup_plan() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_plan() TO authenticated;

REVOKE ALL ON FUNCTION public.get_top_pending_users(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_top_pending_users(integer) TO authenticated;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

-- --- User-callable RPCs: revoke anon, keep authenticated ---
REVOKE ALL ON FUNCTION public.reschedule_organic_run(uuid, integer, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reschedule_organic_run(uuid, integer, timestamptz) TO authenticated;

-- --- Safe utility helpers used in RLS: revoke anon, keep authenticated ---
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_public_markup() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_markup() TO authenticated;

REVOKE ALL ON FUNCTION public.is_maintenance_mode() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_maintenance_mode() TO authenticated;

-- Ensure service_role can still execute everything (edge functions rely on this)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
