-- Revoke EXECUTE from PUBLIC and anon on every SECURITY DEFINER function in
-- schema public. All such functions in this project already gate access via
-- has_role(auth.uid(),'admin') or auth.uid()=user_id, so anon has no
-- legitimate reason to call them.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name,
           p.proname  AS fn_name,
           pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prosecdef = true
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon',
      fn.schema_name, fn.fn_name, fn.args
    );
  END LOOP;
END $$;