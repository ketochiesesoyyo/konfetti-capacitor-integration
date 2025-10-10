-- Add DELETE policy to event_attendees table
-- Users can leave events they've joined

CREATE POLICY "Users can leave events they joined" 
ON public.event_attendees 
FOR DELETE 
USING (auth.uid() = user_id);