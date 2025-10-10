-- Drop the old SELECT policy
DROP POLICY IF EXISTS "Users can view events they attend" ON public.events;

-- Create new SELECT policy that allows both attendees AND creators
CREATE POLICY "Users can view events they attend or created"
ON public.events
FOR SELECT
TO authenticated
USING (
  (created_by = auth.uid()) OR
  (EXISTS (
    SELECT 1
    FROM event_attendees
    WHERE event_attendees.event_id = events.id
      AND event_attendees.user_id = auth.uid()
  ))
);