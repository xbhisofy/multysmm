
DO $$
DECLARE tbl record;
BEGIN
  FOR tbl IN
    SELECT c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r' AND n.nspname = 'public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.table_name);
  END LOOP;
END $$;

-- Public-readable tables (no auth.uid() scoping) need anon SELECT
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.providers TO anon;
GRANT SELECT ON public.engagement_bundles TO anon;
GRANT SELECT ON public.bundle_items TO anon;
GRANT SELECT ON public.platform_settings TO anon;
GRANT SELECT ON public.popup_ads TO anon;

-- Sequences (for inserts using serial/identity)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
