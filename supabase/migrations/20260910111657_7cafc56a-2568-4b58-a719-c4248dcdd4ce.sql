CREATE POLICY "Applicants upload own resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Applicants update own resumes"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Applicants delete own resumes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Applicant or listing owner reads resumes"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.skill_applications a
      JOIN public.skills s ON s.id = a.skill_id
      WHERE a.resume_path = storage.objects.name AND s.user_id = auth.uid()
    )
  )
);