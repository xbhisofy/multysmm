CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('organic-runs-minutely');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('check-order-status-every-5-min');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('check-order-status-every-2-min');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'organic-runs-minutely',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bcowzxvrjcyqwdkufoeu.supabase.co/functions/v1/execute-all-runs',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer sb_publishable_2t0Gtl1dLOpHZKlNdTat7Q_4Uno4qbN","apikey":"sb_publishable_2t0Gtl1dLOpHZKlNdTat7Q_4Uno4qbN"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'check-order-status-every-2-min',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bcowzxvrjcyqwdkufoeu.supabase.co/functions/v1/check-order-status',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer sb_publishable_2t0Gtl1dLOpHZKlNdTat7Q_4Uno4qbN","apikey":"sb_publishable_2t0Gtl1dLOpHZKlNdTat7Q_4Uno4qbN"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.engagement_orders;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.engagement_order_items;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.organic_run_schedule;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;