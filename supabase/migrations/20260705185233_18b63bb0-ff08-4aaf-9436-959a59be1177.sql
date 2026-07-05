
CREATE INDEX IF NOT EXISTS idx_transactions_deposits_completed
  ON public.transactions (user_id, created_at DESC)
  WHERE type = 'deposit' AND status = 'completed';

CREATE OR REPLACE FUNCTION public.get_admin_users_summary()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT
      p.id,
      p.user_id,
      p.email,
      p.full_name,
      p.telegram_username,
      p.created_at,
      p.updated_at,
      COALESCE(p.is_banned, false) AS is_banned,
      p.banned_reason,
      p.banned_at,
      COALESCE(w.balance, 0) AS balance,
      COALESCE(w.total_deposited, 0) AS total_deposited,
      COALESCE(w.total_spent, 0) AS total_spent,
      COALESCE(ur.role::text, 'user') AS role,
      COALESCE(s.plan_type, 'none') AS plan_type,
      COALESCE(s.status, 'inactive') AS subscription_status,
      s.expires_at AS subscription_expires,
      dep.last_deposit_at,
      dep.deposit_count,
      COALESCE(o_cnt.n, 0) AS single_orders_count,
      COALESCE(eo_cnt.n, 0) AS engagement_orders_count,
      (COALESCE(o_cnt.n,0) + COALESCE(eo_cnt.n,0)) AS total_orders_count,
      o_cnt.last_order_at AS last_single_order_at,
      eo_cnt.last_order_at AS last_engagement_order_at,
      GREATEST(
        COALESCE(dep.last_deposit_at, 'epoch'::timestamptz),
        COALESCE(o_cnt.last_order_at, 'epoch'::timestamptz),
        COALESCE(eo_cnt.last_order_at, 'epoch'::timestamptz),
        COALESCE(p.updated_at, 'epoch'::timestamptz),
        COALESCE(au.last_sign_in_at, 'epoch'::timestamptz)
      ) AS last_active_at,
      au.last_sign_in_at,
      -- order status buckets (kept for existing UI code)
      COALESCE(o_cnt.active_n, 0) AS active_single_orders,
      COALESCE(o_cnt.paused_n, 0) AS paused_single_orders,
      COALESCE(eo_cnt.active_n, 0) AS active_engagement_orders,
      COALESCE(eo_cnt.paused_n, 0) AS paused_engagement_orders
    FROM profiles p
    LEFT JOIN wallets w ON w.user_id = p.user_id
    LEFT JOIN user_roles ur ON ur.user_id = p.user_id
    LEFT JOIN subscriptions s ON s.user_id = p.user_id
    LEFT JOIN auth.users au ON au.id = p.user_id
    LEFT JOIN LATERAL (
      SELECT
        MAX(tx.created_at) AS last_deposit_at,
        COUNT(*)           AS deposit_count
      FROM transactions tx
      WHERE tx.user_id = p.user_id
        AND tx.type = 'deposit'
        AND tx.status = 'completed'
    ) dep ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)           AS n,
        MAX(o.created_at)  AS last_order_at,
        COUNT(*) FILTER (WHERE o.status IN ('pending','processing')) AS active_n,
        COUNT(*) FILTER (WHERE o.status = 'paused')                  AS paused_n
      FROM orders o WHERE o.user_id = p.user_id
    ) o_cnt ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)           AS n,
        MAX(eo.created_at) AS last_order_at,
        COUNT(*) FILTER (WHERE eo.status IN ('pending','processing')) AS active_n,
        COUNT(*) FILTER (WHERE eo.status = 'paused')                  AS paused_n
      FROM engagement_orders eo WHERE eo.user_id = p.user_id
    ) eo_cnt ON TRUE
    ORDER BY dep.last_deposit_at DESC NULLS LAST, p.created_at DESC
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_admin_users_summary() TO authenticated;
