CREATE OR REPLACE FUNCTION public.admin_set_user_ban(target_user_id uuid, ban boolean, reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF ban THEN
    UPDATE public.profiles
    SET is_banned = true,
        banned_reason = COALESCE(reason, 'Banned by admin'),
        banned_at = now(),
        updated_at = now()
    WHERE user_id = target_user_id;
  ELSE
    UPDATE public.profiles
    SET is_banned = false,
        banned_reason = NULL,
        banned_at = NULL,
        updated_at = now()
    WHERE user_id = target_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_ban(uuid, boolean, text) TO authenticated;