-- Document server-side-only write pattern for tables flagged by scanner.
-- All writes to these tables go through SECURITY DEFINER functions
-- (debit_wallet_for_order, credit_wallet_zapupi, admin_adjust_wallet,
--  cancel_order_with_refund) or service-role edge functions, which all
--  enforce user_id = auth.uid() and validate amounts/fields server-side.
--  The enforce_wallet_credit_trail trigger additionally guarantees every
--  wallet balance/deposit increase is backed by a matching transactions row.

COMMENT ON TABLE public.deposits IS
  'Server-side writes only. No client INSERT/UPDATE policy on purpose — created by ZapUPI edge functions / admin RPCs which set user_id = auth.uid() and restrict admin_notes/reviewed_by/status.';

COMMENT ON TABLE public.orders IS
  'Server-side writes only. Regular users cannot INSERT via PostgREST; orders are created by edge functions (create-order, etc.) that enforce user_id = auth.uid() before insert.';

COMMENT ON TABLE public.transactions IS
  'Server-side writes only. All INSERTs happen inside SECURITY DEFINER functions (debit_wallet_for_order, credit_wallet_zapupi, admin_adjust_wallet, cancel_order_with_refund) that enforce user_id = auth.uid() and compute balance_after atomically.';

COMMENT ON TABLE public.wallets IS
  'Server-side writes only. Creates/updates happen via handle_new_user trigger and SECURITY DEFINER functions (debit_wallet_for_order, credit_wallet_zapupi, admin_adjust_wallet). enforce_wallet_credit_trail trigger blocks any balance/deposit increase without a matching transactions row.';

COMMENT ON TABLE public.zapupi_deposits IS
  'Server-side writes only. Rows created and updated exclusively by ZapUPI edge functions / credit_wallet_zapupi RPC. Users cannot manipulate credited, gateway_response, or mismatch_meta.';

-- Belt-and-braces: re-revoke EXECUTE from authenticated/anon/PUBLIC on
-- SECURITY DEFINER functions that must never be called directly by users.
-- (Utility helpers like has_role, get_user_role, get_public_markup,
--  is_maintenance_mode, and reschedule_organic_run stay callable by
--  authenticated on purpose; every other function enforces admin/service-role
--  internally and clients should reach them through edge functions.)

DO $$
DECLARE
  fn record;
  keep_authenticated text[] := ARRAY[
    'has_role', 'get_user_role', 'get_public_markup',
    'is_maintenance_mode', 'reschedule_organic_run'
  ];
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    IF NOT (fn.proname = ANY(keep_authenticated)) THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
    END IF;
  END LOOP;
END $$;