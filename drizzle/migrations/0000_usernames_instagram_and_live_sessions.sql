
-- ===== 1. Username + Instagram link on profiles =====
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_url text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (lower(username)) WHERE username IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_format') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format
      CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$');
  END IF;
END $$;

GRANT SELECT (username, instagram_url) ON public.profiles TO anon, authenticated;
GRANT UPDATE (username, instagram_url) ON public.profiles TO authenticated;

-- Backfill usernames for existing students
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

-- Auto-assign a username for every new profile (any signup path)
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

DROP TRIGGER IF EXISTS profiles_assign_username ON public.profiles;
CREATE TRIGGER profiles_assign_username
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_profile_username();

-- ===== 2. Live skill-exchange sessions =====
CREATE TABLE public.skill_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL UNIQUE,
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_sessions TO authenticated;
GRANT ALL ON public.skill_sessions TO service_role;
ALTER TABLE public.skill_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view sessions"
ON public.skill_sessions FOR SELECT TO authenticated
USING (host_id = auth.uid() OR guest_id = auth.uid());

CREATE POLICY "Hosts create sessions"
ON public.skill_sessions FOR INSERT TO authenticated
WITH CHECK (host_id = auth.uid());

CREATE POLICY "Participants update sessions"
ON public.skill_sessions FOR UPDATE TO authenticated
USING (host_id = auth.uid() OR guest_id = auth.uid());

CREATE POLICY "Hosts delete sessions"
ON public.skill_sessions FOR DELETE TO authenticated
USING (host_id = auth.uid());

DROP TRIGGER IF EXISTS skill_sessions_set_updated_at ON public.skill_sessions;
CREATE TRIGGER skill_sessions_set_updated_at
BEFORE UPDATE ON public.skill_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== 3. Shared whiteboard strokes =====
CREATE TABLE public.session_strokes (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.skill_sessions(id) ON DELETE CASCADE,
  sheet int NOT NULL DEFAULT 0 CHECK (sheet >= 0),
  kind text NOT NULL CHECK (kind IN ('stroke','text')),
  payload jsonb NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX session_strokes_session_sheet_idx ON public.session_strokes (session_id, sheet);

GRANT SELECT, INSERT, DELETE ON public.session_strokes TO authenticated;
GRANT ALL ON public.session_strokes TO service_role;
ALTER TABLE public.session_strokes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view strokes"
ON public.session_strokes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.skill_sessions s
    WHERE s.id = session_id AND (s.host_id = auth.uid() OR s.guest_id = auth.uid())
  )
);

CREATE POLICY "Participants add strokes"
ON public.session_strokes FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.skill_sessions s
    WHERE s.id = session_id AND (s.host_id = auth.uid() OR s.guest_id = auth.uid())
  )
);

CREATE POLICY "Participants clear strokes"
ON public.session_strokes FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.skill_sessions s
    WHERE s.id = session_id AND (s.host_id = auth.uid() OR s.guest_id = auth.uid())
  )
);

-- ===== 4. Realtime =====
ALTER PUBLICATION supabase_realtime ADD TABLE public.skill_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_strokes;
