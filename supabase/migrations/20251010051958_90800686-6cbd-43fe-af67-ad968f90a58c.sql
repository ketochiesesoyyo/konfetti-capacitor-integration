-- Fix security issue: Remove host visibility from matches
-- Only the two matched users should be able to see their match

DROP POLICY IF EXISTS "Users can view matches in their events" ON public.matches;

CREATE POLICY "Users can view their own matches only" 
ON public.matches 
FOR SELECT 
USING (
  (user1_id = auth.uid() OR user2_id = auth.uid())
  AND user_is_event_attendee(auth.uid(), event_id)
);