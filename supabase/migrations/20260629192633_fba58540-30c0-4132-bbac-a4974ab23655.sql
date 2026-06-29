
-- =========================================================
-- 1. Lock down SECURITY DEFINER function EXECUTE permissions
-- =========================================================

-- Revoke EXECUTE from PUBLIC / anon / authenticated on every SECURITY DEFINER function
REVOKE EXECUTE ON FUNCTION public.cancel_order_with_refund(uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_pending_runs_on_eo_cancel() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_pending_runs_on_item_cancel() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_completed_engagement_orders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_rotation_lock_key() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_user_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_wallet_zapupi(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debit_wallet_for_order(uuid, numeric, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_wallet_credit_trail() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.engagement_order_items_lock_user_columns() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.engagement_orders_lock_user_columns() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_users_summary() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_provider_topup_breakdown() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_provider_topup_plan() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_markup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_top_pending_users(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_maintenance_mode() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.organic_run_schedule_lock_user_columns() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pg_advisory_xact_lock(bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_zapupi_fraud_strike(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reschedule_organic_run(uuid, integer, timestamp with time zone) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_conversation_last_message() FROM PUBLIC, anon, authenticated;

-- Re-grant ONLY the functions legitimately called by the authenticated client.
-- All of these self-enforce admin checks internally where needed.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_markup() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_maintenance_mode() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.reschedule_organic_run(uuid, integer, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_plan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_breakdown() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_pending_users(integer) TO authenticated;

-- service_role retains full access for backend / edge functions / triggers
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =========================================================
-- 2. Harden user_roles against privilege escalation
-- =========================================================
-- Explicit RESTRICTIVE policy: no client (anon or authenticated) can INSERT into user_roles.
-- Role grants must go through admin policies or the service role (handle_new_user trigger
-- runs as SECURITY DEFINER and bypasses RLS).

DROP POLICY IF EXISTS "Block client inserts to user_roles" ON public.user_roles;
CREATE POLICY "Block client inserts to user_roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
