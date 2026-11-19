ALTER TABLE public.skill_sessions ADD COLUMN IF NOT EXISTS active_call_id uuid;
GRANT UPDATE (active_call_id) ON public.skill_sessions TO authenticated;