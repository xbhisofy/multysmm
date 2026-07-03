GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_breakdown() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_topup_plan() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_pending_users(integer) TO anon, authenticated;