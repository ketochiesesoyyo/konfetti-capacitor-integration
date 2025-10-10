-- Fix privacy issue: Remove host access from messages table
-- Hosts should NOT be able to read private messages between matched users

-- Drop existing policies
DROP POLICY IF EXISTS "Users can send messages in their matches or hosts to attendees" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their matches or hosts can view all" ON public.messages;

-- Create new policies WITHOUT host access
-- Only matched users can view their own messages
CREATE POLICY "Users can view messages in their matches only"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- Only matched users can send messages to each other
CREATE POLICY "Users can send messages in their matches only"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1
    FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- Note: The create_facilitated_match function uses SECURITY DEFINER
-- so it can still insert introduction messages from hosts, bypassing RLS
-- This is the ONLY way hosts can send messages, and only once per match