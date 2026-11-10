CREATE OR REPLACE FUNCTION public.set_primary_bundle(p_bundle_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_platform text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT platform INTO v_platform FROM public.engagement_bundles WHERE id = p_bundle_id AND is_active = true;
  IF v_platform IS NULL THEN RAISE EXCEPTION 'Select an active bundle'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('primary-bundle:' || v_platform)::bigint);
  WITH ranked AS (
    SELECT id, (row_number() OVER (ORDER BY (id = p_bundle_id) DESC, sort_order ASC NULLS LAST, id) - 1)::integer AS position
    FROM public.engagement_bundles WHERE platform = v_platform
  )
  UPDATE public.engagement_bundles b SET sort_order = r.position FROM ranked r WHERE b.id = r.id;
END;
$$;
REVOKE ALL ON FUNCTION public.set_primary_bundle(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_primary_bundle(uuid) TO authenticated, service_role;