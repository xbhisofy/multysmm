
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated;', r.proname, r.args);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.is_maintenance_mode() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.reschedule_organic_run(uuid, integer, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_plan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_breakdown() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_pending_users(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;

DROP POLICY IF EXISTS "Anyone can view bundle items" ON public.bundle_items;
CREATE POLICY "Authenticated users can view bundle items"
  ON public.bundle_items FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.bundle_items FROM anon;
