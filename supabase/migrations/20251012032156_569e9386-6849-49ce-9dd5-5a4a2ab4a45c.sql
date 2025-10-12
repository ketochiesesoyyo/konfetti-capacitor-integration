-- Add UPDATE policy for swipes table so users can change their swipe direction
CREATE POLICY "Users can update their own swipes"
ON public.swipes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);