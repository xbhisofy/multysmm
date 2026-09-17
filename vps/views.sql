CREATE OR REPLACE VIEW public.providers_public AS
 SELECT id, name, api_url, is_active, created_at, updated_at
   FROM providers
  WHERE (is_active = true);

CREATE OR REPLACE VIEW public.v_orders_missing_debit AS
 WITH all_orders AS (
         SELECT orders.id,
            orders.user_id,
            orders.price AS amt,
            orders.created_at,
            'order'::text AS kind,
            orders.order_number
           FROM orders
          WHERE (orders.status <> 'cancelled'::text)
        UNION ALL
         SELECT engagement_orders.id,
            engagement_orders.user_id,
            engagement_orders.total_price,
            engagement_orders.created_at,
            'engagement'::text AS text,
            engagement_orders.order_number
           FROM engagement_orders
          WHERE (engagement_orders.status <> 'cancelled'::text)
        )
 SELECT id, user_id, kind, order_number, amt, created_at
   FROM all_orders o
  WHERE ((created_at > '2026-06-20 00:00:00+00'::timestamp with time zone) AND (NOT (EXISTS ( SELECT 1
           FROM transactions t
          WHERE ((t.user_id = o.user_id) AND (t.type = ANY (ARRAY['order_payment'::text, 'order'::text])) AND ((t.created_at >= (o.created_at - '00:05:00'::interval)) AND (t.created_at <= (o.created_at + '00:05:00'::interval))) AND (abs((abs(t.amount) - o.amt)) < 0.01))))));
