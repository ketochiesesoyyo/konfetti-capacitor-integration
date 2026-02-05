-- Add company_name field to event_requests for wedding planners
ALTER TABLE public.event_requests ADD COLUMN IF NOT EXISTS company_name text;
