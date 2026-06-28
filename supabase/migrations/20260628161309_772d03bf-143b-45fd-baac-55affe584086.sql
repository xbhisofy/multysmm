
ALTER TABLE public.engagement_order_items
  ADD COLUMN IF NOT EXISTS start_count integer,
  ADD COLUMN IF NOT EXISTS start_count_captured_at timestamptz;

-- Lock these fields against user updates (mirror existing engagement_order_items_lock_user_columns)
CREATE OR REPLACE FUNCTION public.engagement_order_items_lock_user_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
BEGIN
  IF v_uid IS NULL THEN RETURN NEW; END IF;
  SELECT public.has_role(v_uid, 'admin'::app_role) INTO v_is_admin;
  IF v_is_admin THEN RETURN NEW; END IF;

  NEW.engagement_order_id := OLD.engagement_order_id;
  NEW.engagement_type     := OLD.engagement_type;
  NEW.service_id          := OLD.service_id;
  NEW.quantity            := OLD.quantity;
  NEW.price               := OLD.price;
  NEW.created_at          := OLD.created_at;
  NEW.start_count         := OLD.start_count;
  NEW.start_count_captured_at := OLD.start_count_captured_at;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('paused','processing','cancelled') THEN
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END $function$;
