-- Update the can_join_event function to allow up to 100 guests for free plan
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
  
  -- Allow if under 100 guests
  RETURN guest_count < 100;
END;
$function$;