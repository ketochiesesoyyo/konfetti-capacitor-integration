-- Allow event hosts to send messages to any attendee without requiring a match
-- Drop existing policy
DROP POLICY IF EXISTS "Users can send messages in their matches" ON public.messages;

-- Create new policy that allows:
-- 1. Users to send messages in their matches
-- 2. Event creators to send messages to any attendee
CREATE POLICY "Users can send messages in their matches or hosts to attendees" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  (auth.uid() = sender_id) AND (
    -- Either they have a match
    EXISTS (
      SELECT 1
      FROM matches
      WHERE matches.id = messages.match_id 
        AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
    OR
    -- Or the sender is the event creator and recipient is an attendee
    EXISTS (
      SELECT 1
      FROM matches m
      JOIN events e ON e.id = m.event_id
      WHERE m.id = messages.match_id
        AND e.created_by = auth.uid()
    )
  )
);

-- Update the view policy similarly
DROP POLICY IF EXISTS "Users can view messages in their matches" ON public.messages;

CREATE POLICY "Users can view messages in their matches or hosts can view all" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM matches
    WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1
    FROM matches m
    JOIN events e ON e.id = m.event_id
    WHERE m.id = messages.match_id
      AND e.created_by = auth.uid()
  )
);