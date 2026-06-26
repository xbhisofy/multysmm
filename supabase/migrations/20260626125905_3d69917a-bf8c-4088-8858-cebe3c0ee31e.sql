
-- 1. Switch security definer view to security invoker
ALTER VIEW public.v_orders_missing_debit SET (security_invoker = on);

-- 2. Revoke EXECUTE from PUBLIC and anon on all SECURITY DEFINER functions
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC', r.proname, r.args);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM anon', r.proname, r.args);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM authenticated', r.proname, r.args);
  END LOOP;
END $$;

-- 3. Grant EXECUTE to authenticated only on functions called by the client app via RPC
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_maintenance_mode() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_public_markup() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order_with_refund(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reschedule_organic_run(uuid, integer, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_pending_users(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_plan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_breakdown() TO authenticated;

-- service_role retains access for edge functions implicitly via SUPABASE_SERVICE_ROLE_KEY bypass
GRANT EXECUTE ON FUNCTION public.credit_wallet_zapupi(text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.debit_wallet_for_order(uuid, numeric, uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_completed_engagement_orders() TO service_role;
GRANT EXECUTE ON FUNCTION public.pg_advisory_xact_lock(bigint) TO service_role;
