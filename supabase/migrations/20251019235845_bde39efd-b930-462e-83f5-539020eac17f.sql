-- Remove intro request feature (unused and has security vulnerability)

-- Drop the facilitated match function
DROP FUNCTION IF EXISTS public.create_facilitated_match(uuid, text);

-- Drop the eligibility check function
DROP FUNCTION IF EXISTS public.check_intro_request_eligibility(uuid, uuid, uuid);

-- Drop the intro_requests table (will cascade drop all policies)
DROP TABLE IF EXISTS public.intro_requests CASCADE;

-- Remove the allow_intro_requests column from events table (no longer needed)
ALTER TABLE public.events DROP COLUMN IF EXISTS allow_intro_requests;