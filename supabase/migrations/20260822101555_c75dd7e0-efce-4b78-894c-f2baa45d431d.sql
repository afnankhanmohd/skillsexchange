
CREATE OR REPLACE FUNCTION private.get_user_contact(_user_id uuid)
RETURNS TABLE(email text, phone text, contact_visible boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _viewer uuid := auth.uid();
  _recent integer;
  _distinct_targets integer;
BEGIN
  IF _viewer IS NULL THEN
    RETURN;
  END IF;

  IF _viewer <> _user_id THEN
    SELECT count(*) INTO _recent
    FROM public.contact_lookups cl
    WHERE cl.viewer_id = _viewer AND cl.created_at > now() - interval '1 hour';

    SELECT count(DISTINCT cl.target_id) INTO _distinct_targets
    FROM public.contact_lookups cl
    WHERE cl.viewer_id = _viewer AND cl.created_at > now() - interval '1 hour';

    IF _recent >= 60 OR _distinct_targets >= 25 THEN
      RAISE EXCEPTION 'contact_lookup_rate_limited'
        USING HINT = 'Too many contact lookups. Please try again later.';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.contact_lookups cl
      WHERE cl.viewer_id = _viewer
        AND cl.target_id = _user_id
        AND cl.created_at > now() - interval '10 minutes'
    ) THEN
      INSERT INTO public.contact_lookups (viewer_id, target_id) VALUES (_viewer, _user_id);
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    CASE WHEN p.id = _viewer OR p.contact_visible THEN p.email ELSE NULL END,
    CASE WHEN p.id = _viewer OR p.contact_visible THEN p.phone ELSE NULL END,
    p.contact_visible
  FROM public.profiles p
  WHERE p.id = _user_id;
END;
$function$;

REVOKE ALL ON FUNCTION private.get_user_contact(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_user_contact(uuid) TO service_role;

DROP FUNCTION IF EXISTS public.get_user_contact(uuid);

CREATE OR REPLACE FUNCTION public.get_user_contact(_user_id uuid)
RETURNS TABLE(email text, phone text, contact_visible boolean)
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT g.email, g.phone, g.contact_visible
  FROM private.get_user_contact(_user_id) g
  WHERE auth.uid() IS NOT NULL;
$function$;

REVOKE ALL ON FUNCTION public.get_user_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_contact(uuid) TO authenticated, service_role;

GRANT SELECT ON public.contact_lookups TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.contact_lookups FROM authenticated, anon;
GRANT ALL ON public.contact_lookups TO service_role;

DROP POLICY IF EXISTS "Only internal processes write lookups" ON public.contact_lookups;
CREATE POLICY "Only internal processes write lookups"
ON public.contact_lookups FOR INSERT TO service_role
WITH CHECK (true);
