CREATE OR REPLACE FUNCTION public.get_admin_analytics(p_from timestamptz, p_to timestamptz)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_span interval;
  v_prev_from timestamptz;
  v_prev_to timestamptz;
  v_current json;
  v_previous json;
  v_lifetime json;
  v_platforms json;
  v_platforms_spent json;
  v_top_depositors json;
  v_top_spenders json;
  v_top_orders json;
  v_current_wallet numeric;
  v_total_spent numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_from IS NULL OR p_to IS NULL OR p_to <= p_from THEN
    RAISE EXCEPTION 'invalid range';
  END IF;

  v_span := p_to - p_from;
  v_prev_to := p_from;
  v_prev_from := p_from - v_span;

  WITH tx AS (
    SELECT * FROM public.transactions
    WHERE created_at >= p_from AND created_at < p_to
  ),
  dep AS (
    SELECT amount FROM tx WHERE type='deposit' AND status='completed'
  ),
  ord AS (
    SELECT id, user_id, status, price::numeric AS price, created_at, service_id
    FROM public.orders WHERE created_at >= p_from AND created_at < p_to
  ),
  eord AS (
    SELECT id, user_id, status, total_price::numeric AS price, created_at
    FROM public.engagement_orders WHERE created_at >= p_from AND created_at < p_to
  ),
  all_orders AS (
    SELECT id, user_id, status, price, created_at FROM ord
    UNION ALL
    SELECT id, user_id, status, price, created_at FROM eord
  ),
  fin AS (
    SELECT
      COALESCE(SUM(amount),0)                                     AS total_deposits,
      COALESCE(COUNT(*),0)                                        AS deposits_count,
      COALESCE(AVG(amount),0)                                     AS avg_deposit,
      COALESCE(MAX(amount),0)                                     AS largest_deposit,
      COALESCE(MIN(amount),0)                                     AS smallest_deposit
    FROM dep
  ),
  fin_extra AS (
    SELECT
      COALESCE(SUM(CASE WHEN type='deposit' AND status='pending'  THEN amount ELSE 0 END),0) AS pending_deposits,
      COALESCE(SUM(CASE WHEN type='deposit' AND status='failed'   THEN amount ELSE 0 END),0) AS failed_deposits,
      COALESCE(SUM(CASE WHEN type='refund'  AND status='completed' THEN ABS(amount) ELSE 0 END),0) AS refunded_amount,
      COALESCE(SUM(CASE WHEN type='order_payment' AND status='completed' THEN ABS(amount) ELSE 0 END),0) AS wallet_debits,
      COALESCE(SUM(CASE WHEN type='order_payment' AND status='completed' THEN ABS(amount) ELSE 0 END),0) AS total_spent,
      COALESCE(COUNT(*) FILTER (WHERE type='order_payment' AND status='completed'),0) AS spenders_count,
      COALESCE(SUM(CASE WHEN type IN ('deposit','refund') AND status='completed' THEN amount ELSE 0 END),0) AS wallet_credits
    FROM tx
  ),
  ord_stats AS (
    SELECT
      COUNT(*)                                                          AS total_orders,
      COUNT(*) FILTER (WHERE status='completed')                        AS completed_orders,
      COUNT(*) FILTER (WHERE status='processing')                       AS processing_orders,
      COUNT(*) FILTER (WHERE status='pending')                          AS pending_orders,
      COUNT(*) FILTER (WHERE status='cancelled')                        AS cancelled_orders,
      COUNT(*) FILTER (WHERE status='failed')                           AS failed_orders,
      COUNT(*) FILTER (WHERE status='refunded')                         AS refunded_orders,
      COALESCE(SUM(price),0)                                            AS gross_revenue,
      COALESCE(AVG(price),0)                                            AS avg_order_value,
      COALESCE(MAX(price),0)                                            AS highest_order_value,
      COALESCE(MIN(price),0)                                            AS lowest_order_value
    FROM all_orders
  ),
  dep_users AS (
    SELECT DISTINCT user_id FROM tx WHERE type='deposit' AND status='completed'
  ),
  users_stats AS (
    SELECT
      (SELECT COUNT(*) FROM public.profiles p WHERE p.created_at >= p_from AND p.created_at < p_to) AS new_users,
      (SELECT COUNT(DISTINCT user_id) FROM dep_users) AS users_who_deposited,
      (SELECT COUNT(*) FROM auth.users au WHERE au.last_sign_in_at >= p_from AND au.last_sign_in_at < p_to) AS active_users,
      (SELECT COUNT(*) FROM public.profiles WHERE COALESCE(is_banned,false)=true) AS banned_users
  )
  SELECT json_build_object(
    'financial', (SELECT row_to_json(f) FROM (SELECT fin.*, fin_extra.* FROM fin, fin_extra) f),
    'orders',    (SELECT row_to_json(o) FROM ord_stats o),
    'users',     (SELECT row_to_json(u) FROM users_stats u)
  ) INTO v_current;

  -- Previous window
  WITH tx AS (
    SELECT * FROM public.transactions
    WHERE created_at >= v_prev_from AND created_at < v_prev_to
  ),
  dep AS (SELECT amount FROM tx WHERE type='deposit' AND status='completed'),
  ord AS (
    SELECT id, price::numeric AS price, status FROM public.orders
    WHERE created_at >= v_prev_from AND created_at < v_prev_to
  ),
  eord AS (
    SELECT id, total_price::numeric AS price, status FROM public.engagement_orders
    WHERE created_at >= v_prev_from AND created_at < v_prev_to
  ),
  all_orders AS (
    SELECT id, price, status FROM ord UNION ALL SELECT id, price, status FROM eord
  )
  SELECT json_build_object(
    'total_deposits', COALESCE((SELECT SUM(amount) FROM dep),0),
    'gross_revenue',  COALESCE((SELECT SUM(price) FROM all_orders),0),
    'total_orders',   COALESCE((SELECT COUNT(*) FROM all_orders),0),
    'total_spent',    COALESCE((SELECT SUM(ABS(amount)) FROM tx WHERE type='order_payment' AND status='completed'),0),
    'new_users',      COALESCE((SELECT COUNT(*) FROM public.profiles WHERE created_at >= v_prev_from AND created_at < v_prev_to),0)
  ) INTO v_previous;

  -- Lifetime + live wallet
  SELECT COALESCE(SUM(balance),0) INTO v_current_wallet FROM public.wallets;
  SELECT COALESCE(SUM(ABS(amount)),0) INTO v_total_spent
    FROM public.transactions WHERE type='order_payment' AND status='completed';

  SELECT json_build_object(
    'lifetime_deposits',   COALESCE((SELECT SUM(amount) FROM public.transactions WHERE type='deposit' AND status='completed'),0),
    'lifetime_spent',      v_total_spent,
    'lifetime_users',      (SELECT COUNT(*) FROM public.profiles),
    'lifetime_orders',     (SELECT COUNT(*) FROM public.orders) + (SELECT COUNT(*) FROM public.engagement_orders),
    'current_wallet_total', v_current_wallet,
    'vip_users',           (SELECT COUNT(*) FROM public.wallets WHERE total_deposited >= 100),
    'banned_users',        (SELECT COUNT(*) FROM public.profiles WHERE COALESCE(is_banned,false)=true)
  ) INTO v_lifetime;

  -- Platform breakdown (count + spent) for the range
  WITH single_o AS (
    SELECT COALESCE(s.category,'Other') AS cat, COALESCE(o.price::numeric,0) AS price
    FROM public.orders o
    LEFT JOIN public.services s ON s.id = o.service_id
    WHERE o.created_at >= p_from AND o.created_at < p_to
  ),
  eng_o AS (
    SELECT COALESCE(s.category,'Other') AS cat, COALESCE(eoi.price::numeric,0) AS price
    FROM public.engagement_order_items eoi
    JOIN public.engagement_orders eo ON eo.id = eoi.engagement_order_id
    LEFT JOIN public.services s ON s.id = eoi.service_id
    WHERE eo.created_at >= p_from AND eo.created_at < p_to
  ),
  cats AS (
    SELECT cat, price FROM single_o UNION ALL SELECT cat, price FROM eng_o
  ),
  norm AS (
    SELECT
      CASE
        WHEN cat ILIKE '%instagram%' THEN 'Instagram'
        WHEN cat ILIKE '%tiktok%'    THEN 'TikTok'
        WHEN cat ILIKE '%youtube%'   THEN 'YouTube'
        WHEN cat ILIKE '%facebook%'  THEN 'Facebook'
        WHEN cat ILIKE '%telegram%'  THEN 'Telegram'
        WHEN cat ILIKE '%twitter%' OR cat ILIKE '%x %' OR cat = 'X' THEN 'X (Twitter)'
        ELSE 'Other'
      END AS platform,
      price
    FROM cats
  ),
  agg AS (
    SELECT platform, COUNT(*)::bigint AS count, COALESCE(SUM(price),0)::numeric AS spent
    FROM norm GROUP BY platform ORDER BY spent DESC
  )
  SELECT
    COALESCE(json_agg(json_build_object('platform', platform, 'count', count) ORDER BY count DESC), '[]'::json),
    COALESCE(json_agg(json_build_object('platform', platform, 'spent', spent, 'count', count) ORDER BY spent DESC), '[]'::json)
  INTO v_platforms, v_platforms_spent
  FROM agg;

  -- Top 10 depositors
  SELECT COALESCE(json_agg(row_to_json(x)),'[]'::json) INTO v_top_depositors
  FROM (
    SELECT p.user_id, p.email, p.full_name, SUM(t.amount)::numeric AS amount, COUNT(*)::bigint AS n
    FROM public.transactions t
    JOIN public.profiles p ON p.user_id = t.user_id
    WHERE t.type='deposit' AND t.status='completed'
      AND t.created_at >= p_from AND t.created_at < p_to
    GROUP BY p.user_id, p.email, p.full_name
    ORDER BY amount DESC
    LIMIT 10
  ) x;

  -- Top 10 spenders
  SELECT COALESCE(json_agg(row_to_json(x)),'[]'::json) INTO v_top_spenders
  FROM (
    SELECT p.user_id, p.email, p.full_name, SUM(ABS(t.amount))::numeric AS amount, COUNT(*)::bigint AS n
    FROM public.transactions t
    JOIN public.profiles p ON p.user_id = t.user_id
    WHERE t.type='order_payment' AND t.status='completed'
      AND t.created_at >= p_from AND t.created_at < p_to
    GROUP BY p.user_id, p.email, p.full_name
    ORDER BY amount DESC
    LIMIT 10
  ) x;

  -- Top 10 by order count
  SELECT COALESCE(json_agg(row_to_json(x)),'[]'::json) INTO v_top_orders
  FROM (
    WITH all_o AS (
      SELECT user_id FROM public.orders WHERE created_at >= p_from AND created_at < p_to
      UNION ALL
      SELECT user_id FROM public.engagement_orders WHERE created_at >= p_from AND created_at < p_to
    )
    SELECT p.user_id, p.email, p.full_name, COUNT(*)::bigint AS n
    FROM all_o
    JOIN public.profiles p ON p.user_id = all_o.user_id
    GROUP BY p.user_id, p.email, p.full_name
    ORDER BY n DESC
    LIMIT 10
  ) x;

  RETURN json_build_object(
    'from', p_from,
    'to', p_to,
    'prev_from', v_prev_from,
    'prev_to', v_prev_to,
    'current', v_current,
    'previous', v_previous,
    'lifetime', v_lifetime,
    'platforms', v_platforms,
    'platforms_spent', v_platforms_spent,
    'top_depositors', v_top_depositors,
    'top_spenders', v_top_spenders,
    'top_orders', v_top_orders
  );
END;
$function$;