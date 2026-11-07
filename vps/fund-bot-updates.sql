CREATE TABLE IF NOT EXISTS public.fund_bot_updates (
  update_id bigint PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.fund_bot_updates TO service_role;
REVOKE ALL ON public.fund_bot_updates FROM anon, authenticated;
ALTER TABLE public.fund_bot_updates ENABLE ROW LEVEL SECURITY;