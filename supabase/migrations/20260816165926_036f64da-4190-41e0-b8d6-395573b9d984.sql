-- 1. Hide profile email column from public/browser clients
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, college, location, bio, avatar_url, portfolio_url, linkedin_url, availability, role, created_at, updated_at) ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. Remove direct execute access to internal SECURITY DEFINER / trigger functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated, PUBLIC;