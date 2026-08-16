CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated, PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'admin');
$$;
REVOKE ALL ON FUNCTION private.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins read contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins update contact messages" ON public.contact_messages;

CREATE POLICY "Admins read contact messages" ON public.contact_messages
FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));

CREATE POLICY "Admins update contact messages" ON public.contact_messages
FOR UPDATE TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP FUNCTION IF EXISTS public.is_admin(uuid);