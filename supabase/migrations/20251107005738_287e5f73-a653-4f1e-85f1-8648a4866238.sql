-- Update guest limit from 100 to 50 for free plan
CREATE OR REPLACE FUNCTION public.can_join_event(_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  guest_count integer;
BEGIN
  -- Get current guest count
  SELECT get_event_guest_count(_event_id) INTO guest_count;
  
  -- Allow if under 50 guests
  RETURN guest_count < 50;
END;
$function$;

-- Add instagram_username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instagram_username text;