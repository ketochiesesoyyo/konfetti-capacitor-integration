-- Add plan column to events table
ALTER TABLE events 
ADD COLUMN plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium'));

-- Add comment for clarity
COMMENT ON COLUMN events.plan IS 'Event plan tier: free (max 10 guests) or premium (unlimited guests)';

-- Helper function to get guest count for an event
CREATE OR REPLACE FUNCTION get_event_guest_count(_event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM event_attendees
  WHERE event_id = _event_id
$$;

-- Helper function to check if event can accept more guests
CREATE OR REPLACE FUNCTION can_join_event(_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_plan text;
  guest_count integer;
BEGIN
  -- Get event plan
  SELECT plan INTO event_plan
  FROM events
  WHERE id = _event_id;
  
  -- If premium, always allow
  IF event_plan = 'premium' THEN
    RETURN true;
  END IF;
  
  -- For free plan, check guest count
  SELECT get_event_guest_count(_event_id) INTO guest_count;
  
  -- Allow if under 10 guests
  RETURN guest_count < 10;
END;
$$;