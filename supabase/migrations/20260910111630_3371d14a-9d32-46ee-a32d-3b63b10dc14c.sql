CREATE TABLE public.skill_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter text NOT NULL,
  resume_path text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_applications TO authenticated;
GRANT ALL ON public.skill_applications TO service_role;

ALTER TABLE public.skill_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicant or listing owner reads applications"
ON public.skill_applications FOR SELECT TO authenticated
USING (
  auth.uid() = applicant_id
  OR EXISTS (SELECT 1 FROM public.skills s WHERE s.id = skill_id AND s.user_id = auth.uid())
);

CREATE POLICY "Users apply for themselves"
ON public.skill_applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Listing owner updates applications"
ON public.skill_applications FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.skills s WHERE s.id = skill_id AND s.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.skills s WHERE s.id = skill_id AND s.user_id = auth.uid()));

CREATE POLICY "Applicant withdraws application"
ON public.skill_applications FOR DELETE TO authenticated
USING (auth.uid() = applicant_id);

CREATE INDEX skill_applications_skill_id_idx ON public.skill_applications(skill_id);
CREATE INDEX skill_applications_applicant_id_idx ON public.skill_applications(applicant_id);

CREATE TRIGGER skill_applications_updated_at
BEFORE UPDATE ON public.skill_applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.skill_applications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.skill_applications;