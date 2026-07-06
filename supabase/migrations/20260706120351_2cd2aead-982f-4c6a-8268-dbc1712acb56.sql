
CREATE OR REPLACE FUNCTION public.get_user_engagement_orders_summary(p_limit int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  order_number bigint,
  status text,
  total_price numeric,
  link text,
  base_quantity int,
  created_at timestamptz,
  updated_at timestamptz,
  is_organic_mode boolean,
  items jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my_orders AS (
    SELECT eo.*
    FROM public.engagement_orders eo
    WHERE eo.user_id = auth.uid()
    ORDER BY eo.created_at DESC
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200))
  ),
  item_agg AS (
    SELECT
      eoi.id,
      eoi.engagement_order_id,
      eoi.engagement_type,
      eoi.quantity,
      eoi.status,
      COALESCE(rs.total_runs, 0)      AS total_runs,
      COALESCE(rs.completed_runs, 0)  AS completed_runs,
      COALESCE(rs.cancelled_runs, 0)  AS cancelled_runs,
      COALESCE(rs.started_runs, 0)    AS started_runs,
      COALESCE(rs.delivered_qty, 0)   AS delivered_qty
    FROM public.engagement_order_items eoi
    JOIN my_orders o ON o.id = eoi.engagement_order_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int                                                      AS total_runs,
        COUNT(*) FILTER (WHERE r.status = 'completed')::int                AS completed_runs,
        COUNT(*) FILTER (WHERE r.status = 'cancelled')::int                AS cancelled_runs,
        COUNT(*) FILTER (WHERE r.status = 'started')::int                  AS started_runs,
        COALESCE(SUM(r.quantity_to_send) FILTER (WHERE r.status = 'completed'), 0)::int AS delivered_qty
      FROM public.organic_run_schedule r
      WHERE r.engagement_order_item_id = eoi.id
    ) rs ON TRUE
  )
  SELECT
    o.id,
    o.order_number,
    o.status,
    o.total_price,
    o.link,
    o.base_quantity,
    o.created_at,
    o.updated_at,
    o.is_organic_mode,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
          'id', ia.id,
          'engagement_type', ia.engagement_type,
          'quantity', ia.quantity,
          'status', ia.status,
          'total_runs', ia.total_runs,
          'completed_runs', ia.completed_runs,
          'cancelled_runs', ia.cancelled_runs,
          'started_runs', ia.started_runs,
          'delivered_qty', ia.delivered_qty
        ))
       FROM item_agg ia WHERE ia.engagement_order_id = o.id),
      '[]'::jsonb
    ) AS items
  FROM my_orders o
  ORDER BY o.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_user_engagement_orders_summary(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_engagement_orders_summary(int) TO authenticated;
