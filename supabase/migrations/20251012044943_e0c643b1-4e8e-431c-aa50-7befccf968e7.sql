-- Drop existing message policies
DROP POLICY IF EXISTS "Users can send messages in their matches only" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their matches only" ON messages;

-- Create new policy that allows both match participants AND event hosts to send messages
CREATE POLICY "Users and hosts can send messages in matches"
ON messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND (
    -- Check if user is part of the match
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
    OR
    -- Check if user is the event host
    EXISTS (
      SELECT 1 FROM matches
      JOIN events ON events.id = matches.event_id
      WHERE matches.id = messages.match_id
      AND events.created_by = auth.uid()
    )
  )
);

-- Create new policy that allows both match participants AND event hosts to view messages
CREATE POLICY "Users and hosts can view messages in matches"
ON messages
FOR SELECT
USING (
  -- Check if user is part of the match
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
  OR
  -- Check if user is the event host
  EXISTS (
    SELECT 1 FROM matches
    JOIN events ON events.id = matches.event_id
    WHERE matches.id = messages.match_id
    AND events.created_by = auth.uid()
  )
);