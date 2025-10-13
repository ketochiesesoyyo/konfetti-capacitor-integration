-- Create security definer function to check if user is event host
CREATE OR REPLACE FUNCTION public.user_is_event_host(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events
    WHERE id = _event_id
      AND created_by = _user_id
  )
$$;

-- Drop and recreate the event_attendees SELECT policy using the new function
DROP POLICY IF EXISTS "Users can view attendees of their events" ON event_attendees;

CREATE POLICY "Users can view attendees of their events"
ON event_attendees FOR SELECT
USING (
  user_is_event_attendee(auth.uid(), event_id) OR
  user_is_event_host(auth.uid(), event_id)
);