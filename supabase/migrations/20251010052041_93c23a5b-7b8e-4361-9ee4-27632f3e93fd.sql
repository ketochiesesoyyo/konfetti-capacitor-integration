-- Add DELETE policy to profiles table
-- Users can only delete their own profile

CREATE POLICY "Users can delete their own profile only" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);