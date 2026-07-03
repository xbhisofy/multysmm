
-- 1. Deposits table
CREATE TABLE public.oxapay_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id text UNIQUE NOT NULL,
  track_id text,
  amount_usd numeric(12,4) NOT NULL,
  amount_inr numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  pay_currency text,
  credited boolean NOT NULL DEFAULT false,
  payment_url text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.oxapay_deposits TO authenticated;
GRANT ALL ON public.oxapay_deposits TO service_role;

ALTER TABLE public.oxapay_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own oxapay deposits" ON public.oxapay_deposits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_oxapay_deposits_user ON public.oxapay_deposits(user_id, created_at DESC);
CREATE INDEX idx_oxapay_deposits_status ON public.oxapay_deposits(status) WHERE credited = false;

CREATE TRIGGER trg_oxapay_deposits_updated_at BEFORE UPDATE ON public.oxapay_deposits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Webhook events log
CREATE TABLE public.oxapay_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text,
  track_id text,
  hmac_valid boolean NOT NULL DEFAULT false,
  processed boolean NOT NULL DEFAULT false,
  headers jsonb,
  raw_payload jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.oxapay_webhook_events TO service_role;
ALTER TABLE public.oxapay_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read oxapay webhook events" ON public.oxapay_webhook_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_oxapay_webhook_order ON public.oxapay_webhook_events(order_id, created_at DESC);

-- 3. Guard trigger: only backend can flip credited / promote status
CREATE OR REPLACE FUNCTION public.guard_oxapay_deposit_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF current_user IN ('postgres','supabase_admin','service_role') THEN
    RETURN NEW;
  END IF;

  IF NEW.credited IS DISTINCT FROM OLD.credited AND NEW.credited THEN
    RAISE EXCEPTION 'Forbidden: only backend can mark oxapay credited';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND lower(NEW.status) IN ('paid','confirmed','completed','success') THEN
    RAISE EXCEPTION 'Forbidden: only backend can promote oxapay status';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_guard_oxapay
  BEFORE UPDATE ON public.oxapay_deposits
  FOR EACH ROW EXECUTE FUNCTION public.guard_oxapay_deposit_change();

-- 4. Credit function (idempotent, fixed ₹90 = $1)
CREATE OR REPLACE FUNCTION public.credit_wallet_oxapay(p_order_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_dep record;
  v_balance numeric;
  v_deposited numeric;
  v_new_balance numeric;
  v_credit_usd numeric;
  v_credit_inr numeric;
  v_rate numeric := 90;
  v_tx_id uuid;
BEGIN
  IF COALESCE(btrim(p_order_id),'') = '' THEN
    RAISE EXCEPTION 'order_id required';
  END IF;

  PERFORM pg_advisory_xact_lock(abs(hashtextextended(p_order_id, 88)));

  SELECT * INTO v_dep FROM public.oxapay_deposits
    WHERE order_id = p_order_id FOR UPDATE;

  IF v_dep.id IS NULL THEN
    RAISE EXCEPTION 'Deposit order not found';
  END IF;

  IF v_dep.credited THEN
    SELECT balance INTO v_balance FROM public.wallets WHERE user_id = v_dep.user_id;
    RETURN json_build_object('credited', false, 'duplicate', true, 'new_balance', COALESCE(v_balance,0));
  END IF;

  IF lower(COALESCE(v_dep.status,'')) NOT IN ('paid','confirmed','completed','success') THEN
    RAISE EXCEPTION 'Deposit not in payable status: %', v_dep.status;
  END IF;

  v_credit_inr := ROUND(v_dep.amount_inr, 2);
  v_credit_usd := ROUND(v_credit_inr / v_rate, 4);

  IF ABS(ROUND(v_dep.amount_usd, 4) - v_credit_usd) > 0.0112 THEN
    RAISE EXCEPTION 'currency mismatch: usd=% expected=%', v_dep.amount_usd, v_credit_usd;
  END IF;

  INSERT INTO public.wallets (user_id, balance, total_deposited, total_spent)
  VALUES (v_dep.user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance, total_deposited INTO v_balance, v_deposited
    FROM public.wallets WHERE user_id = v_dep.user_id FOR UPDATE;

  v_new_balance := trunc(COALESCE(v_balance,0) + v_credit_usd, 4);

  INSERT INTO public.transactions (
    user_id, type, amount, balance_after, status,
    payment_method, payment_reference, description
  ) VALUES (
    v_dep.user_id, 'deposit', v_credit_usd, v_new_balance, 'completed',
    'oxapay', p_order_id,
    'Wallet top-up via OxaPay Crypto (₹' || trim(to_char(v_credit_inr,'FM9999999990D00')) || ')'
  ) RETURNING id INTO v_tx_id;

  UPDATE public.wallets
     SET balance = v_new_balance,
         total_deposited = trunc(COALESCE(v_deposited,0) + v_credit_usd, 4),
         updated_at = now()
   WHERE user_id = v_dep.user_id;

  UPDATE public.oxapay_deposits
     SET credited = true,
         updated_at = now()
   WHERE id = v_dep.id;

  RETURN json_build_object(
    'credited', true,
    'duplicate', false,
    'transaction_id', v_tx_id,
    'new_balance', v_new_balance,
    'credited_inr', v_credit_inr,
    'credited_usd', v_credit_usd
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.credit_wallet_oxapay(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.credit_wallet_oxapay(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.credit_wallet_oxapay(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.credit_wallet_oxapay(text) TO service_role;
