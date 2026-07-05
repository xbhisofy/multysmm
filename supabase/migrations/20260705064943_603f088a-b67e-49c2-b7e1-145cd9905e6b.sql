
-- =====================================================================
-- A) Revoke EXECUTE on sensitive SECURITY DEFINER functions
--    (they will still work when called by service_role from edge functions)
-- =====================================================================
REVOKE EXECUTE ON FUNCTION public.credit_wallet_oxapay(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.credit_wallet_zapupi(text, text, text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, text, numeric, numeric, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.debit_wallet_for_order(uuid, numeric, uuid, uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.record_zapupi_fraud_strike(uuid, text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_users_summary() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_top_pending_users(integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_provider_topup_plan() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_provider_topup_breakdown() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_completed_engagement_orders() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.pg_advisory_xact_lock(bigint) FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.credit_wallet_oxapay(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_wallet_zapupi(text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, text, numeric, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.debit_wallet_for_order(uuid, numeric, uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_zapupi_fraud_strike(uuid, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_users_summary() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_top_pending_users(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_plan() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_breakdown() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_completed_engagement_orders() TO service_role;
GRANT EXECUTE ON FUNCTION public.pg_advisory_xact_lock(bigint) TO service_role;

-- =====================================================================
-- B) Tamper-guard trigger on zapupi_deposits (parity with oxapay)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.guard_zapupi_deposit_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN
    RETURN NEW;
  END IF;

  IF NEW.credited IS DISTINCT FROM OLD.credited AND NEW.credited THEN
    RAISE EXCEPTION 'Forbidden: only backend can mark zapupi credited';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND lower(NEW.status) IN ('paid','confirmed','completed','success') THEN
    RAISE EXCEPTION 'Forbidden: only backend can promote zapupi status';
  END IF;

  IF NEW.amount_inr IS DISTINCT FROM OLD.amount_inr
     OR NEW.amount_usd IS DISTINCT FROM OLD.amount_usd THEN
    RAISE EXCEPTION 'Forbidden: deposit amount is immutable';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Forbidden: deposit user_id is immutable';
  END IF;

  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS guard_zapupi_deposit_change_trigger ON public.zapupi_deposits;
CREATE TRIGGER guard_zapupi_deposit_change_trigger
  BEFORE UPDATE ON public.zapupi_deposits
  FOR EACH ROW EXECUTE FUNCTION public.guard_zapupi_deposit_change();

-- =====================================================================
-- C) Transactions provenance trigger — deposit type must have a known source
-- =====================================================================
CREATE OR REPLACE FUNCTION public.enforce_transaction_provenance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN
    RETURN NEW;
  END IF;

  IF NEW.type = 'deposit' THEN
    IF NEW.payment_method IS NULL
       OR NEW.payment_method NOT IN ('zapupi','oxapay','razorpay','manual_admin') THEN
      RAISE EXCEPTION 'Invalid deposit source: %', COALESCE(NEW.payment_method,'null');
    END IF;
  END IF;

  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS enforce_transaction_provenance_trigger ON public.transactions;
CREATE TRIGGER enforce_transaction_provenance_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_transaction_provenance();
