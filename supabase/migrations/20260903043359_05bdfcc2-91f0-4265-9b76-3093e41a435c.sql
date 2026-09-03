ALTER PUBLICATION supabase_realtime DROP TABLE public.jobs;
ALTER PUBLICATION supabase_realtime DROP TABLE public.applications;
ALTER TABLE public.jobs REPLICA IDENTITY DEFAULT;
ALTER TABLE public.applications REPLICA IDENTITY DEFAULT;