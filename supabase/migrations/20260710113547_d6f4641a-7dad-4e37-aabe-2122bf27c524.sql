-- Re-grant EXECUTE on admin top-up plan RPCs to ensure PostgREST can call them.
-- Both functions are SECURITY DEFINER and already check has_role(auth.uid(),'admin')
-- internally, so exposing EXECUTE to authenticated is safe.
GRANT EXECUTE ON FUNCTION public.get_provider_topup_breakdown() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_breakdown() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_top_pending_users(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_pending_users(integer) TO service_role;