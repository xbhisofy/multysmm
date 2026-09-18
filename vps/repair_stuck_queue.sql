-- Put provider-busy runs back into the due queue without changing their
-- original run order. The scheduler will retry them on every minute tick.
BEGIN;

UPDATE organic_run_schedule
SET scheduled_at = LEAST(scheduled_at, now()),
    status = 'pending',
    started_at = NULL,
    error_message = regexp_replace(
      coalesce(error_message, 'Waiting for provider'),
      '^\[(Postponed|Batch postponed|Auto-retry[^]]*)\]',
      '[Queued]',
      'i'
    ),
    last_status_check = NULL
WHERE provider_order_id IS NULL
  AND status IN ('pending', 'failed')
  AND (
    lower(coalesce(error_message, '')) LIKE '%postponed%'
    OR lower(coalesce(error_message, '')) LIKE '%active order%'
    OR lower(coalesce(error_message, '')) LIKE '%all providers busy%'
    OR lower(coalesce(error_message, '')) LIKE '%auto-retry%'
    OR scheduled_at > now()
  );

COMMIT;