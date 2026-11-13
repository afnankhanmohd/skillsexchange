CREATE TABLE public.session_call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.skill_sessions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signal_type text NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.session_call_signals TO authenticated;
GRANT ALL ON public.session_call_signals TO service_role;
ALTER TABLE public.session_call_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read call signals" ON public.session_call_signals FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.skill_sessions s
    WHERE s.id = session_call_signals.session_id
      AND (s.host_id = auth.uid() OR s.guest_id = auth.uid())
  )
);
CREATE POLICY "Participants send call signals as themselves" ON public.session_call_signals FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.skill_sessions s
    WHERE s.id = session_call_signals.session_id
      AND (s.host_id = auth.uid() OR s.guest_id = auth.uid())
  )
);
CREATE POLICY "Participants clear call signals" ON public.session_call_signals FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.skill_sessions s
    WHERE s.id = session_call_signals.session_id
      AND (s.host_id = auth.uid() OR s.guest_id = auth.uid())
  )
);
CREATE INDEX session_call_signals_session_created_idx ON public.session_call_signals (session_id, created_at);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'session_call_signals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.session_call_signals;
  END IF;
END $$;