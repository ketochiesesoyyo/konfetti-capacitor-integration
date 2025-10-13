-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view attendees of their events" ON event_attendees;

-- Create updated policy that allows both attendees AND event hosts to view attendees
CREATE POLICY "Users can view attendees of their events"
ON event_attendees FOR SELECT
USING (
  user_is_event_attendee(auth.uid(), event_id) OR
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_attendees.event_id
      AND events.created_by = auth.uid()
  )
);