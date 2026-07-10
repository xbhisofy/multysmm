-- 1) Cleanup function that removes finished single orders + finished engagement
--    orders older than 24 hours. Pending/processing rows are never touched.
CREATE OR REPLACE FUNCTION public.cleanup_finished_orders_24h()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_terminal text[] := ARRAY['completed','cancelled','failed','refunded','partial'];
  v_deleted_orders int := 0;
  v_deleted_order_runs int := 0;
  v_eng json;
BEGIN
  -- --- Regular orders (public.orders) ---
  -- Delete organic_run_schedule rows tied to these orders first (FK-safe).
  WITH target_orders AS (
    SELECT id FROM public.orders
     WHERE status = ANY (v_terminal)
       AND COALESCE(updated_at, created_at) < now() - interval '24 hours'
  ),
  del_runs AS (
    DELETE FROM public.organic_run_schedule
     WHERE order_id IN (SELECT id FROM target_orders)
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted_order_runs FROM del_runs;

  WITH del_o AS (
    DELETE FROM public.orders
     WHERE status = ANY (v_terminal)
       AND COALESCE(updated_at, created_at) < now() - interval '24 hours'
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted_orders FROM del_o;

  -- --- Engagement orders: reuse existing 24h cleanup helper ---
  SELECT public.cleanup_old_completed_engagement_orders() INTO v_eng;

  RETURN json_build_object(
    'ran_at', now(),
    'orders_deleted', v_deleted_orders,
    'order_runs_deleted', v_deleted_order_runs,
    'engagement', v_eng
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_finished_orders_24h() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cleanup_finished_orders_24h() TO service_role;

-- 2) Schedule it every hour (idempotent).
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-finished-orders-24h');
EXCEPTION WHEN OTHERS THEN
  -- job may not exist yet — ignore
  NULL;
END $$;

SELECT cron.schedule(
  'cleanup-finished-orders-24h',
  '17 * * * *',  -- every hour at :17
  $$SELECT public.cleanup_finished_orders_24h();$$
);