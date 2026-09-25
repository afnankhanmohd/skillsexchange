DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can submit valid contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can submit valid contact messages" ON public.contact_messages
FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(btrim(name)) BETWEEN 1 AND 100
  AND char_length(btrim(message)) BETWEEN 1 AND 2000
  AND (phone_number IS NULL OR char_length(phone_number) <= 20)
  AND is_read = false
);