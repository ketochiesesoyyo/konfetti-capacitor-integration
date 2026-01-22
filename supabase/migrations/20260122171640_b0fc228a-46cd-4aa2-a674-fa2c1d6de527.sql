-- Add submitter_type column to event_requests table
ALTER TABLE public.event_requests 
ADD COLUMN submitter_type text NOT NULL DEFAULT 'couple';

-- Add comment for documentation
COMMENT ON COLUMN public.event_requests.submitter_type IS 'Indicates who is submitting the request: couple or wedding_planner';