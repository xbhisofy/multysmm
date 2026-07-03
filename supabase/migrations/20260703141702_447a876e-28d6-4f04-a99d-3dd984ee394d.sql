
CREATE TABLE public.order_health_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_kind text NOT NULL,           -- 'order' | 'engagement_order' | 'engagement_run'
  order_ref uuid NOT NULL,            -- id of order/engagement_order/organic_run_schedule
  issue_code text NOT NULL,           -- 'stuck_no_progress' | 'debited_no_provider' | 'provider_cancelled' | 'provider_failed' | 'run_overdue' etc
  priority text NOT NULL DEFAULT 'medium',
  first_alerted_at timestamptz NOT NULL DEFAULT now(),
  last_alerted_at timestamptz NOT NULL DEFAULT now(),
  next_reminder_at timestamptz,
  reminder_step int NOT NULL DEFAULT 0,
  notification_count int NOT NULL DEFAULT 1,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  last_details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_kind, order_ref, issue_code)
);

GRANT ALL ON public.order_health_alerts TO service_role;
ALTER TABLE public.order_health_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read order health alerts" ON public.order_health_alerts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_ohalerts_open ON public.order_health_alerts(resolved, next_reminder_at) WHERE resolved = false;
CREATE INDEX idx_ohalerts_ref ON public.order_health_alerts(order_kind, order_ref);

CREATE TRIGGER trg_ohalerts_updated_at BEFORE UPDATE ON public.order_health_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
