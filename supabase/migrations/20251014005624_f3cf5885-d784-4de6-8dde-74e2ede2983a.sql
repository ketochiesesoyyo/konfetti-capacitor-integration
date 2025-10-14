-- Allow date to be null for draft events
ALTER TABLE public.events 
ALTER COLUMN date DROP NOT NULL;