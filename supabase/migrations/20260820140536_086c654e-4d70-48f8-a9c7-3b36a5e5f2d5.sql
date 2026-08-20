CREATE TABLE IF NOT EXISTS public.contact_lookups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_lookups_viewer_created_idx ON public.contact_lookups (viewer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_lookups_pair_idx ON public.contact_lookups (viewer_id, target_id, created_at DESC);

GRANT ALL ON public.contact_lookups TO service_role;
ALTER TABLE public.contact_lookups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Viewers read own lookup history"
  ON public.contact_lookups FOR SELECT TO authenticated
  USING (auth.uid() = viewer_id);
GRANT SELECT ON public.contact_lookups TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_contact(_user_id uuid)
RETURNS TABLE(email text, phone text, contact_visible boolean)
LANGUAGE plpgsql
VOLATILE
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

REVOKE ALL ON FUNCTION public.get_user_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_contact(uuid) TO authenticated, service_role;