-- Allow event hosts to view all matches for their events
DROP POLICY IF EXISTS "Users can view their own matches only" ON matches;

CREATE POLICY "Users can view their own matches only"
ON matches
FOR SELECT
USING (
  ((user1_id = auth.uid()) OR (user2_id = auth.uid()))
  AND user_is_event_attendee(auth.uid(), event_id)
);

CREATE POLICY "Event hosts can view all event matches"
ON matches
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = matches.event_id
    AND events.created_by = auth.uid()
  )
);

-- Allow event hosts to view all swipes for their events
DROP POLICY IF EXISTS "Users can view their own swipes and who liked them" ON swipes;

CREATE POLICY "Users can view their own swipes and who liked them"
ON swipes
FOR SELECT
USING (
  user_is_event_attendee(auth.uid(), event_id)
  AND ((user_id = auth.uid()) OR ((swiped_user_id = auth.uid()) AND (direction = 'right')))
);

CREATE POLICY "Event hosts can view all event swipes"
ON swipes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = swipes.event_id
    AND events.created_by = auth.uid()
  )
);