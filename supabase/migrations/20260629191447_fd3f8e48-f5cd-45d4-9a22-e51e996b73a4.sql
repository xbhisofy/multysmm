
-- ============================================================
-- Layer 5: Ban fields on profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_reason text,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz;

-- ============================================================
-- Layer 3: allow 'mismatch' status + mismatch meta column
-- ============================================================
ALTER TABLE public.zapupi_deposits
  ADD COLUMN IF NOT EXISTS mismatch_meta jsonb;

-- ============================================================
-- Layer 4: Webhook event replay protection
-- ============================================================
CREATE TABLE IF NOT EXISTS public.zapupi_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  order_id text,
  txn_id text,
  utr text,
  status text,
  source text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.zapupi_webhook_events TO service_role;
REVOKE ALL ON public.zapupi_webhook_events FROM anon, authenticated, PUBLIC;

ALTER TABLE public.zapupi_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (which bypasses RLS) can read/write.

CREATE INDEX IF NOT EXISTS idx_zapupi_webhook_events_order
  ON public.zapupi_webhook_events(order_id);

-- ============================================================
-- Hard lock: revoke all write privileges from app roles
-- (RLS already has no INSERT/UPDATE/DELETE policies for these
-- tables, but we belt-and-brace via GRANT revokes too.)
-- ============================================================
REVOKE INSERT, UPDATE, DELETE ON public.wallets         FROM anon, authenticated, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.transactions    FROM anon, authenticated, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.deposits        FROM anon, authenticated, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.zapupi_deposits FROM anon, authenticated, PUBLIC;

GRANT ALL ON public.wallets, public.transactions,
             public.deposits, public.zapupi_deposits TO service_role;

-- ============================================================
-- Hard lock #2 & #3: wallet credit-trail + deposit provenance
-- A balance increase or total_deposited increase on wallets MUST
-- be accompanied by a transactions row inserted in the SAME
-- database transaction (same xmin). Direct UPDATE attempts that
-- bypass our SECURITY DEFINER credit functions will be rejected.
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_wallet_credit_trail()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_increase numeric := COALESCE(NEW.balance,0) - COALESCE(OLD.balance,0);
  v_deposit_increase numeric := COALESCE(NEW.total_deposited,0) - COALESCE(OLD.total_deposited,0);
  v_my_xmin xid;
  v_has_tx boolean := false;
  v_has_deposit boolean := false;
BEGIN
  IF v_balance_increase <= 0 AND v_deposit_increase <= 0 THEN
    RETURN NEW;  -- decrements/no-ops always allowed
  END IF;

  -- xmin of just-updated wallet row == current transaction xid
  SELECT xmin INTO v_my_xmin FROM public.wallets WHERE id = NEW.id;

  IF v_balance_increase > 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.transactions t
       WHERE t.user_id = NEW.user_id
         AND t.xmin = v_my_xmin
    ) INTO v_has_tx;
    IF NOT v_has_tx THEN
      RAISE EXCEPTION 'wallet balance increase without matching transactions row (credit trail violation)';
    END IF;
  END IF;

  IF v_deposit_increase > 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.transactions t
       WHERE t.user_id = NEW.user_id
         AND t.xmin   = v_my_xmin
         AND t.type   = 'deposit'
         AND t.status = 'completed'
    ) INTO v_has_deposit;
    IF NOT v_has_deposit THEN
      RAISE EXCEPTION 'total_deposited increase without matching deposit transaction (provenance violation)';
    END IF;
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_enforce_wallet_credit_trail ON public.wallets;
CREATE CONSTRAINT TRIGGER trg_enforce_wallet_credit_trail
  AFTER UPDATE ON public.wallets
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_wallet_credit_trail();

-- ============================================================
-- Layer 5: fraud-strike + auto-ban helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_zapupi_fraud_strike(
  p_user_id uuid,
  p_reason_code text,
  p_meta jsonb DEFAULT '{}'::jsonb
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_mismatch_24h int;
  v_failed_24h   int;
  v_success_24h  int;
  v_should_ban boolean := false;
  v_ban_reason text;
  v_already_banned boolean := false;
BEGIN
  SELECT email, is_banned INTO v_email, v_already_banned
    FROM public.profiles WHERE user_id = p_user_id;

  -- log strike
  INSERT INTO public.admin_audit_log(
    actor_id, actor_email, target_user_id, target_email,
    action, metadata
  ) VALUES (
    NULL, 'system',
    p_user_id, v_email,
    'fraud_strike:' || p_reason_code,
    COALESCE(p_meta,'{}'::jsonb)
  );

  SELECT COUNT(*) INTO v_mismatch_24h FROM public.zapupi_deposits
    WHERE user_id = p_user_id AND status = 'mismatch'
      AND created_at >= now() - interval '24 hours';
  SELECT COUNT(*) INTO v_failed_24h FROM public.zapupi_deposits
    WHERE user_id = p_user_id AND status = 'failed'
      AND created_at >= now() - interval '24 hours';
  SELECT COUNT(*) INTO v_success_24h FROM public.zapupi_deposits
    WHERE user_id = p_user_id AND status = 'success'
      AND created_at >= now() - interval '24 hours';

  IF v_mismatch_24h >= 1 THEN
    v_should_ban := true;
    v_ban_reason := 'ZapUPI amount mismatch (' || v_mismatch_24h || ' in 24h)';
  ELSIF v_failed_24h >= 5 AND v_success_24h = 0 THEN
    v_should_ban := true;
    v_ban_reason := 'ZapUPI repeated failed deposits (' || v_failed_24h || ' in 24h, 0 success)';
  END IF;

  IF v_should_ban AND NOT COALESCE(v_already_banned,false) THEN
    UPDATE public.profiles
       SET is_banned = true,
           banned_reason = v_ban_reason,
           banned_at = now()
     WHERE user_id = p_user_id;

    INSERT INTO public.admin_audit_log(
      actor_id, actor_email, target_user_id, target_email,
      action, notes, metadata
    ) VALUES (
      NULL, 'system',
      p_user_id, v_email,
      'auto_ban',
      v_ban_reason,
      jsonb_build_object(
        'mismatch_24h', v_mismatch_24h,
        'failed_24h',   v_failed_24h,
        'success_24h',  v_success_24h,
        'reason_code',  p_reason_code
      )
    );
  END IF;

  RETURN json_build_object(
    'banned', v_should_ban AND NOT COALESCE(v_already_banned,false),
    'already_banned', v_already_banned,
    'mismatch_24h', v_mismatch_24h,
    'failed_24h', v_failed_24h,
    'success_24h', v_success_24h,
    'email', v_email,
    'ban_reason', v_ban_reason
  );
END
$$;

REVOKE EXECUTE ON FUNCTION public.record_zapupi_fraud_strike(uuid, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.record_zapupi_fraud_strike(uuid, text, jsonb)
  TO service_role;
