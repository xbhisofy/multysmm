
-- 1) Revoke default PUBLIC execute on all SECURITY DEFINER functions in public
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- 2) Grant back EXECUTE to authenticated on user-callable helpers
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_markup()                    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_maintenance_mode()                  TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_engagement_orders_summary(integer)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_engagement_orders_summary(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reschedule_organic_run(uuid, integer, timestamptz)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_with_refund(uuid, uuid, boolean)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_summary()              TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats()            TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_plan()              TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_breakdown()         TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_pending_users(integer)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, text, numeric, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_ban(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pg_advisory_xact_lock(bigint)          TO authenticated;

-- 3) Explicit "deny client inserts" policies for money-handling tables.
-- Service role bypasses RLS, so backend flows still work.
DROP POLICY IF EXISTS "No client inserts (wallets)" ON public.wallets;
CREATE POLICY "No client inserts (wallets)" ON public.wallets
  FOR INSERT TO authenticated, anon WITH CHECK (false);

DROP POLICY IF EXISTS "No client updates (wallets)" ON public.wallets;
CREATE POLICY "No client updates (wallets)" ON public.wallets
  FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No client deletes (wallets)" ON public.wallets;
CREATE POLICY "No client deletes (wallets)" ON public.wallets
  FOR DELETE TO authenticated, anon USING (false);

DROP POLICY IF EXISTS "No client inserts (transactions)" ON public.transactions;
CREATE POLICY "No client inserts (transactions)" ON public.transactions
  FOR INSERT TO authenticated, anon WITH CHECK (false);

DROP POLICY IF EXISTS "No client updates (transactions)" ON public.transactions;
CREATE POLICY "No client updates (transactions)" ON public.transactions
  FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No client deletes (transactions)" ON public.transactions;
CREATE POLICY "No client deletes (transactions)" ON public.transactions
  FOR DELETE TO authenticated, anon USING (false);

DROP POLICY IF EXISTS "No client inserts (deposits)" ON public.deposits;
CREATE POLICY "No client inserts (deposits)" ON public.deposits
  FOR INSERT TO authenticated, anon WITH CHECK (false);

DROP POLICY IF EXISTS "No client inserts (orders)" ON public.orders;
CREATE POLICY "No client inserts (orders)" ON public.orders
  FOR INSERT TO authenticated, anon WITH CHECK (false);

DROP POLICY IF EXISTS "No client inserts (engagement_orders)" ON public.engagement_orders;
CREATE POLICY "No client inserts (engagement_orders)" ON public.engagement_orders
  FOR INSERT TO authenticated, anon WITH CHECK (false);
