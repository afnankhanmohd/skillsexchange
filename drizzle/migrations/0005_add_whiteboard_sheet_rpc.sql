CREATE OR REPLACE FUNCTION public.add_session_sheet(_session_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_sheet integer;
BEGIN
  UPDATE public.skill_sessions
  SET sheet_count = sheet_count + 1,
      active_sheet = sheet_count
  WHERE id = _session_id
    AND sheet_count < 20
  RETURNING active_sheet INTO new_sheet;

  IF new_sheet IS NULL THEN
    RAISE EXCEPTION 'This board has reached its sheet limit or is unavailable';
  END IF;

  RETURN new_sheet;
END;
$$;
REVOKE ALL ON FUNCTION public.add_session_sheet(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_session_sheet(uuid) TO authenticated;