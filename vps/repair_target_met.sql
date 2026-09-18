-- Repair runs that were wrongly auto-cancelled as "Target met" by the old
-- public-count guard. Only runs that were never sent to a provider are restored.
BEGIN;

WITH restored AS (
  UPDATE organic_run_schedule r
  SET status = 'pending',
      completed_at = NULL,
      error_message = NULL,
      scheduled_at = LEAST(r.scheduled_at, now())
  WHERE r.status = 'cancelled'
    AND lower(coalesce(r.error_message, '')) LIKE 'target met%'
    AND r.provider_order_id IS NULL
  RETURNING r.engagement_order_item_id
)
UPDATE engagement_order_items i
SET status = 'processing', updated_at = now()
WHERE i.id IN (SELECT engagement_order_item_id FROM restored)
  AND i.status = 'completed';

UPDATE engagement_orders o
SET status = 'processing', completed_at = NULL, updated_at = now()
WHERE o.status = 'completed'
  AND EXISTS (
    SELECT 1 FROM engagement_order_items i
    WHERE i.engagement_order_id = o.id AND i.status <> 'completed'
  );

COMMIT;
