
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(
  p_target_user_id uuid,
  p_action text,
  p_usd numeric,
  p_inr numeric,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_deposited numeric;
  v_spent numeric;
  v_new_balance numeric;
  v_new_deposited numeric;
  v_is_add boolean := (p_action = 'add');
  v_amount numeric;
BEGIN
  IF p_action NOT IN ('add','subtract') THEN
    RAISE EXCEPTION 'invalid action';
  END IF;
  IF p_usd IS NULL OR p_usd <= 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;

  v_amount := trunc(p_usd::numeric, 4);

  SELECT balance, total_deposited, total_spent
    INTO v_balance, v_deposited, v_spent
  FROM public.wallets WHERE user_id = p_target_user_id FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'wallet not found';
  END IF;

  IF v_is_add THEN
    v_new_balance := trunc(v_balance + v_amount, 4);
    v_new_deposited := trunc(COALESCE(v_deposited,0) + v_amount, 4);
  ELSE
    v_new_balance := trunc(v_balance - v_amount, 4);
    IF v_new_balance < 0 THEN
      RAISE EXCEPTION 'balance cannot be negative';
    END IF;
    v_new_deposited := v_deposited;
  END IF;

  -- Insert transaction FIRST so its xmin matches the wallet update xmin in this same tx
  INSERT INTO public.transactions (
    user_id, type, amount, balance_after, description, status, payment_method
  ) VALUES (
    p_target_user_id,
    CASE WHEN v_is_add THEN 'deposit' ELSE 'refund' END,
    CASE WHEN v_is_add THEN v_amount ELSE -v_amount END,
    v_new_balance,
    (CASE WHEN v_is_add THEN 'Admin manual credit' ELSE 'Admin withdrawal' END)
      || ' — ₹' || trim(to_char(p_inr,'FM9999999990D00'))
      || CASE WHEN p_notes IS NOT NULL AND p_notes <> '' THEN ' — ' || p_notes ELSE '' END,
    'completed',
    CASE WHEN v_is_add THEN 'manual_admin' ELSE NULL END
  );

  UPDATE public.wallets
     SET balance = v_new_balance,
         total_deposited = v_new_deposited,
         updated_at = now()
   WHERE user_id = p_target_user_id;

  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid,text,numeric,numeric,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid,text,numeric,numeric,text) TO service_role;
