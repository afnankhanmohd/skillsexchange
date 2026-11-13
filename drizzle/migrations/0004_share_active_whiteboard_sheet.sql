ALTER TABLE public.skill_sessions
  ADD COLUMN active_sheet integer NOT NULL DEFAULT 0 CHECK (active_sheet BETWEEN 0 AND 19);