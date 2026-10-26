
CREATE OR REPLACE FUNCTION public.assign_profile_username()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base text;
  candidate text;
  i int;
BEGIN
  IF NEW.username IS NOT NULL AND NEW.username <> '' THEN
    NEW.username := lower(NEW.username);
    RETURN NEW;
  END IF;
  base := lower(regexp_replace(split_part(coalesce(NEW.full_name, 'student'), ' ', 1), '[^a-z0-9_]', '', 'g'));
  IF char_length(base) < 3 THEN base := 'student'; END IF;
  IF char_length(base) > 16 THEN base := left(base, 16); END IF;
  candidate := base;
  i := 0;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = candidate) LOOP
    i := i + 1;
    candidate := base || i::text;
  END LOOP;
  NEW.username := candidate;
  RETURN NEW;
END $$;

UPDATE public.profiles SET username = NULL;

DO $$
DECLARE
  r record;
  base text;
  candidate text;
  i int;
BEGIN
  FOR r IN SELECT id, full_name FROM public.profiles WHERE username IS NULL LOOP
    base := lower(regexp_replace(split_part(coalesce(r.full_name, 'student'), ' ', 1), '[^a-z0-9_]', '', 'g'));
    IF char_length(base) < 3 THEN base := 'student'; END IF;
    IF char_length(base) > 16 THEN base := left(base, 16); END IF;
    candidate := base;
    i := 0;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = candidate) LOOP
      i := i + 1;
      candidate := base || i::text;
    END LOOP;
    UPDATE public.profiles SET username = candidate WHERE id = r.id;
  END LOOP;
END $$;

-- Open-invite rooms: a second signed-in student can claim the guest seat
DROP POLICY IF EXISTS "Participants can view sessions" ON public.skill_sessions;
DROP POLICY IF EXISTS "Participants update sessions" ON public.skill_sessions;
CREATE POLICY "Participants can view sessions"
ON public.skill_sessions FOR SELECT TO authenticated
USING (host_id = auth.uid() OR guest_id = auth.uid() OR guest_id IS NULL);

CREATE POLICY "Participants update sessions"
ON public.skill_sessions FOR UPDATE TO authenticated
USING (host_id = auth.uid() OR guest_id = auth.uid() OR guest_id IS NULL);
