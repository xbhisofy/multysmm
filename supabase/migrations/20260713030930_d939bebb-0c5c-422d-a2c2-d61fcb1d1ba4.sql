
-- =========================================================
-- 1. profiles: block users from editing sensitive columns
-- =========================================================
CREATE OR REPLACE FUNCTION public.profiles_block_privileged_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := current_setting('request.jwt.claim.role', true);
  v_is_admin boolean := false;
BEGIN
  -- service_role / postgres bypass entirely
  IF v_role = 'service_role' OR session_user IN ('postgres','supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    v_is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  END IF;

  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- Non-admin: restore protected columns to OLD values
  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
    NEW.is_banned := OLD.is_banned;
  END IF;
  IF NEW.api_key IS DISTINCT FROM OLD.api_key THEN
    NEW.api_key := OLD.api_key;
  END IF;
  IF NEW.telegram_id IS DISTINCT FROM OLD.telegram_id THEN
    NEW.telegram_id := OLD.telegram_id;
  END IF;
  IF NEW.organic_ratios IS DISTINCT FROM OLD.organic_ratios THEN
    NEW.organic_ratios := OLD.organic_ratios;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    NEW.user_id := OLD.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_block_privileged_updates ON public.profiles;
CREATE TRIGGER profiles_block_privileged_updates
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profiles_block_privileged_updates();

REVOKE EXECUTE ON FUNCTION public.profiles_block_privileged_updates() FROM PUBLIC, anon, authenticated;

-- =========================================================
-- 2. oxapay_deposits: explicit deny for authenticated writes
-- =========================================================
DROP POLICY IF EXISTS "Deny client insert on oxapay_deposits" ON public.oxapay_deposits;
CREATE POLICY "Deny client insert on oxapay_deposits"
ON public.oxapay_deposits
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

DROP POLICY IF EXISTS "Deny client update on oxapay_deposits" ON public.oxapay_deposits;
CREATE POLICY "Deny client update on oxapay_deposits"
ON public.oxapay_deposits
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "Deny client delete on oxapay_deposits" ON public.oxapay_deposits;
CREATE POLICY "Deny client delete on oxapay_deposits"
ON public.oxapay_deposits
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);

-- =========================================================
-- 3. SECURITY DEFINER function execute grants
-- =========================================================

-- Trigger functions: never call-able via API. Revoke from all roles.
REVOKE EXECUTE ON FUNCTION public.cancel_pending_runs_on_eo_cancel() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_pending_runs_on_item_cancel() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_rotation_lock_key() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_user_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_wallet_credit_trail() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.engagement_order_items_lock_user_columns() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.engagement_orders_lock_user_columns() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_oxapay_deposit_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_provider_config_is_active() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_zapupi_deposit_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.organic_run_schedule_lock_user_columns() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_conversation_last_message() FROM PUBLIC, anon, authenticated;

-- Service-only / cron functions
REVOKE EXECUTE ON FUNCTION public.cleanup_finished_orders_24h() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_completed_engagement_orders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_wallet_oxapay(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_wallet_zapupi(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debit_wallet_for_order(uuid, numeric, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_zapupi_fraud_strike(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reschedule_organic_run(uuid, integer, timestamp with time zone) FROM PUBLIC, anon, authenticated;

-- Admin-only RPCs: keep authenticated (has internal has_role check), revoke anon
REVOKE EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, text, numeric, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_ban(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_analytics(timestamp with time zone, timestamp with time zone) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_users_summary() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_provider_topup_breakdown() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_provider_topup_plan() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_top_pending_users(integer) FROM PUBLIC, anon;

-- User-facing RPCs: keep authenticated, revoke anon
REVOKE EXECUTE ON FUNCTION public.cancel_order_with_refund(uuid, uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_engagement_orders_summary(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_engagement_orders_summary(integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

-- Public helpers: leave get_public_markup and is_maintenance_mode as-is (needed pre-auth)
