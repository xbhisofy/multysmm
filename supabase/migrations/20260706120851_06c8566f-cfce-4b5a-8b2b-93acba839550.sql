
CREATE OR REPLACE FUNCTION public.get_user_engagement_orders_summary(p_limit int DEFAULT 50, p_offset int DEFAULT 0)
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
  next_run_at timestamptz,
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
    OFFSET GREATEST(0, COALESCE(p_offset, 0))
  ),
  run_agg AS (
    SELECT
      r.engagement_order_item_id AS item_id,
      COUNT(*) FILTER (
        WHERE r.status <> 'cancelled'
           OR (r.status = 'cancelled' AND lower(coalesce(r.error_message,'')) LIKE 'target met%')
      )::int AS total_runs,
      COUNT(*) FILTER (
        WHERE r.status = 'completed'
           OR (r.status = 'cancelled' AND lower(coalesce(r.error_message,'')) LIKE 'target met%')
      )::int AS completed_runs,
      COUNT(*) FILTER (WHERE r.status = 'started')::int AS started_runs,
      COUNT(*) FILTER (WHERE r.status = 'pending')::int AS pending_runs,
      MIN(r.scheduled_at) FILTER (WHERE r.status = 'pending') AS next_run_at,
      COALESCE(SUM(
        CASE
          WHEN r.status = 'cancelled'
               AND lower(coalesce(r.error_message,'')) LIKE 'target met%'
            THEN r.quantity_to_send
          WHEN lower(coalesce(r.provider_status,'')) IN ('completed','complete')
            THEN r.quantity_to_send
          WHEN r.provider_remains IS NOT NULL
            THEN GREATEST(0, r.quantity_to_send - r.provider_remains)
          WHEN r.status = 'completed'
            THEN r.quantity_to_send
          ELSE 0
        END
      ), 0)::int AS delivered_qty
    FROM public.organic_run_schedule r
    WHERE r.engagement_order_item_id IN (
      SELECT eoi.id FROM public.engagement_order_items eoi
      JOIN my_orders o ON o.id = eoi.engagement_order_id
    )
    GROUP BY r.engagement_order_item_id
  ),
  item_rows AS (
    SELECT
      eoi.id,
      eoi.engagement_order_id,
      eoi.engagement_type,
      eoi.quantity,
      eoi.status,
      COALESCE(ra.total_runs, 0)     AS total_runs,
      COALESCE(ra.completed_runs, 0) AS completed_runs,
      COALESCE(ra.started_runs, 0)   AS started_runs,
      COALESCE(ra.pending_runs, 0)   AS pending_runs,
      COALESCE(ra.delivered_qty, 0)  AS delivered_qty,
      ra.next_run_at
    FROM public.engagement_order_items eoi
    JOIN my_orders o ON o.id = eoi.engagement_order_id
    LEFT JOIN run_agg ra ON ra.item_id = eoi.id
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
    (SELECT MIN(ir.next_run_at) FROM item_rows ir WHERE ir.engagement_order_id = o.id) AS next_run_at,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
          'id', ir.id,
          'engagement_type', ir.engagement_type,
          'quantity', ir.quantity,
          'status', ir.status,
          'total_runs', ir.total_runs,
          'completed_runs', ir.completed_runs,
          'started_runs', ir.started_runs,
          'pending_runs', ir.pending_runs,
          'delivered_qty', ir.delivered_qty,
          'next_run_at', ir.next_run_at
        ))
       FROM item_rows ir WHERE ir.engagement_order_id = o.id),
      '[]'::jsonb
    ) AS items
  FROM my_orders o
  ORDER BY o.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_user_engagement_orders_summary(int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_engagement_orders_summary(int, int) TO authenticated;

-- Ensure ordering index for the paginated scan
CREATE INDEX IF NOT EXISTS idx_engagement_orders_user_created
  ON public.engagement_orders (user_id, created_at DESC);
