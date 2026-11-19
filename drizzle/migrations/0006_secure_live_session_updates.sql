ALTER TABLE public.session_call_signals ADD COLUMN IF NOT EXISTS call_id uuid;

REVOKE UPDATE ON public.skill_sessions FROM authenticated;
GRANT UPDATE (guest_id, status, sheet_count, active_sheet) ON public.skill_sessions TO authenticated;

DROP POLICY IF EXISTS "Participants update sessions" ON public.skill_sessions;
CREATE POLICY "Participants or open seat claim update sessions"
ON public.skill_sessions FOR UPDATE TO authenticated
USING (host_id = auth.uid() OR guest_id = auth.uid() OR guest_id IS NULL)
WITH CHECK (host_id = auth.uid() OR guest_id = auth.uid());