-- Make match_id nullable to support direct messaging
ALTER TABLE messages ALTER COLUMN match_id DROP NOT NULL;

-- Add columns for direct messaging
ALTER TABLE messages ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_id uuid;

-- Add constraint: either match_id OR (event_id + recipient_id) must be present
ALTER TABLE messages ADD CONSTRAINT messages_channel_check 
  CHECK (
    (match_id IS NOT NULL AND event_id IS NULL AND recipient_id IS NULL) OR
    (match_id IS NULL AND event_id IS NOT NULL AND recipient_id IS NOT NULL)
  );

-- Update policies to support direct host-guest messaging
DROP POLICY IF EXISTS "Users and hosts can send messages in matches" ON messages;
DROP POLICY IF EXISTS "Users and hosts can view messages in matches" ON messages;

-- New policy for sending messages (match-based OR direct host-guest)
CREATE POLICY "Users can send messages"
ON messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND (
    -- Match-based messaging
    (match_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    ))
    OR
    -- Host can message any guest in their event
    (event_id IS NOT NULL AND recipient_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = messages.event_id
      AND events.created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM event_attendees
        WHERE event_attendees.event_id = messages.event_id
        AND event_attendees.user_id = messages.recipient_id
      )
    ))
    OR
    -- Guest can reply to host in direct messages
    (event_id IS NOT NULL AND recipient_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = messages.event_id
      AND messages.recipient_id = events.created_by
      AND EXISTS (
        SELECT 1 FROM event_attendees
        WHERE event_attendees.event_id = messages.event_id
        AND event_attendees.user_id = auth.uid()
      )
    ))
  )
);

-- New policy for viewing messages (match-based OR direct)
CREATE POLICY "Users can view their messages"
ON messages
FOR SELECT
USING (
  -- Match-based messaging
  (match_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  ))
  OR
  -- Direct messaging: sender or recipient
  (event_id IS NOT NULL AND (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  ))
);