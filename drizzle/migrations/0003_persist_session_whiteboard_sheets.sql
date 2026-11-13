ALTER TABLE public.skill_sessions
  ADD COLUMN sheet_count integer NOT NULL DEFAULT 1 CHECK (sheet_count BETWEEN 1 AND 20);