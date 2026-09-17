-- 1) Lock down money / maintenance functions: service_role (edge functions) only.
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'admin_adjust_wallet(uuid,text,numeric,numeric,text)',
    'cancel_order_with_refund(uuid,uuid,boolean)',
    'credit_wallet_zapupi(text,text,text,jsonb)',
    'credit_wallet_oxapay(text)',
    'debit_wallet_for_order(uuid,numeric,uuid,uuid,text)',
    'record_zapupi_fraud_strike(uuid,text,jsonb)',
    'cleanup_finished_orders_24h()',
    'cleanup_old_completed_engagement_orders()'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', f);
  END LOOP;
END $$;

-- 2) Admin-only reporting RPCs already verify has_role() internally; keep them for
--    signed-in users but never for anonymous visitors.
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'admin_set_user_ban(uuid,boolean,text)',
    'get_admin_analytics(timestamptz,timestamptz)',
    'get_admin_dashboard_stats()',
    'get_admin_users_summary()',
    'get_provider_topup_plan()',
    'get_provider_topup_breakdown()',
    'get_top_pending_users(integer)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', f);
  END LOOP;
END $$;

-- get_provider_topup_breakdown has no internal admin guard; add one (same rule as its siblings).
CREATE OR REPLACE FUNCTION public.get_provider_topup_breakdown()
RETURNS TABLE(provider_id text, provider_name text, service_id uuid, service_name text,
              service_category text, pending_runs bigint, pending_quantity bigint,
              pending_user_usd numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN QUERY
  SELECT pa.provider_id,
         COALESCE(p.name, pa.provider_id) AS provider_name,
         s.id AS service_id,
         s.name AS service_name,
         s.category AS service_category,
         COUNT(*)::bigint AS pending_runs,
         COALESCE(SUM(ors.quantity_to_send), 0)::bigint AS pending_quantity,
         COALESCE(SUM(ors.quantity_to_send::numeric / 1000 * s.price), 0)::numeric AS pending_user_usd
  FROM public.organic_run_schedule ors
  JOIN public.provider_accounts pa ON pa.id = ors.provider_account_id
  LEFT JOIN public.providers p ON p.id = pa.provider_id
  LEFT JOIN public.engagement_order_items eoi ON eoi.id = ors.engagement_order_item_id
  LEFT JOIN public.services s ON s.id = eoi.service_id
  WHERE ors.status = 'pending'
  GROUP BY pa.provider_id, p.name, s.id, s.name, s.category;
END $$;
REVOKE ALL ON FUNCTION public.get_provider_topup_breakdown() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_breakdown() TO authenticated, service_role;

-- 3) New-account bootstrap. The auth-side trigger is not available in this copy, so the
--    app calls this instead. It is SECURITY DEFINER and can only ever create rows for the
--    caller, always with the plain 'user' role (no privilege escalation possible).
CREATE OR REPLACE FUNCTION public.bootstrap_current_user(p_full_name text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  uemail text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', '')
    INTO uemail;

  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (uid, COALESCE(NULLIF(uemail, ''), uid::text), COALESCE(p_full_name, ''))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.wallets (user_id, balance, total_deposited, total_spent)
  VALUES (uid, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

REVOKE ALL ON FUNCTION public.bootstrap_current_user(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_current_user(text) TO authenticated, service_role;

-- 4) Maintenance-mode settings row is missing entirely (admin toggle showed "no settings found").
INSERT INTO public.platform_settings (maintenance_mode, global_markup_percent)
SELECT false, 0
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);
