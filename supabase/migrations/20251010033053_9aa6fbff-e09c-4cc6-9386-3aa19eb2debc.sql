-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view attendees of their events" ON public.event_attendees;

-- Create a security definer function to check if user is in an event
CREATE OR REPLACE FUNCTION public.user_is_event_attendee(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_attendees
    WHERE user_id = _user_id
      AND event_id = _event_id
  )
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view attendees of their events"
ON public.event_attendees
FOR SELECT
TO authenticated
USING (public.user_is_event_attendee(auth.uid(), event_id));