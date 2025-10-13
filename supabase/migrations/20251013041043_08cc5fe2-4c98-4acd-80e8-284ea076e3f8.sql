-- Add RLS policy to allow users to delete their own swipes
CREATE POLICY "Users can delete their own swipes" 
ON public.swipes 
FOR DELETE 
USING (auth.uid() = user_id);