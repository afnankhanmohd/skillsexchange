ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS contact_visible boolean NOT NULL DEFAULT true;

GRANT SELECT (contact_visible) ON public.profiles TO anon, authenticated;
GRANT UPDATE (phone, contact_visible, email) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_contact(_user_id uuid)
RETURNS TABLE (email text, phone text, contact_visible boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE WHEN p.id = auth.uid() OR p.contact_visible THEN p.email ELSE NULL END,
    CASE WHEN p.id = auth.uid() OR p.contact_visible THEN p.phone ELSE NULL END,
    p.contact_visible
  FROM public.profiles p
  WHERE p.id = _user_id
    AND auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_user_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_contact(uuid) TO authenticated, service_role;