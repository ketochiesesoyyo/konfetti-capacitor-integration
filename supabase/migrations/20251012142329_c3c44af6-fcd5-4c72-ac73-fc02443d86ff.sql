-- Drop the insecure public SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view profiles of people in same events" ON public.profiles;

-- Create secure authenticated-only SELECT policy for profiles
CREATE POLICY "Authenticated users can view profiles in shared events"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR 
    users_share_event(auth.uid(), user_id)
  )
);

-- Drop the existing SELECT policy on events
DROP POLICY IF EXISTS "Users can view events they attend or created" ON public.events;

-- Create secure authenticated-only SELECT policy for events
CREATE POLICY "Authenticated users can view their events"
ON public.events
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1
      FROM event_attendees
      WHERE event_attendees.event_id = events.id 
      AND event_attendees.user_id = auth.uid()
    )
  )
);