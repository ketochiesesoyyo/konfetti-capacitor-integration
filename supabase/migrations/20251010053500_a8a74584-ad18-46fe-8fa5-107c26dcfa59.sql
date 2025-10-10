-- Fix swipes visibility to protect privacy
-- Users can only see:
-- 1. Their own swipes (both directions)
-- 2. People who liked them (direction='right' only)
-- They CANNOT see who passed on them

DROP POLICY IF EXISTS "Users can view swipes in their events" ON public.swipes;

CREATE POLICY "Users can view their own swipes and who liked them" 
ON public.swipes 
FOR SELECT 
USING (
  user_is_event_attendee(auth.uid(), event_id)
  AND (
    -- Can see their own swipes (both likes and passes)
    user_id = auth.uid()
    OR
    -- Can see who liked them, but NOT who passed on them
    (swiped_user_id = auth.uid() AND direction = 'right')
  )
);