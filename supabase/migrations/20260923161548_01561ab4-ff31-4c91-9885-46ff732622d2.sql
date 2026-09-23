DROP POLICY IF EXISTS "Avatar images are readable" ON storage.objects;
DROP POLICY IF EXISTS "Listing photos are viewable" ON storage.objects;
CREATE POLICY "Users read own avatar files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND owner_id = (select auth.uid()::text));
CREATE POLICY "Users read own listing photo files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'listing-photos' AND owner_id = (select auth.uid()::text));