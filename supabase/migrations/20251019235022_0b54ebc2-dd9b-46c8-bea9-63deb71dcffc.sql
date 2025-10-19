-- Add DELETE policy for matches table so users can unmatch
CREATE POLICY "Users can delete their own matches"
  ON public.matches
  FOR DELETE
  USING (
    (user1_id = auth.uid() OR user2_id = auth.uid())
    AND user_is_event_attendee(auth.uid(), event_id)
  );