-- Drop the restrictive profiles SELECT policy
DROP POLICY IF EXISTS "Users can view profiles in active shared events" ON profiles;

-- Create a new policy that allows viewing profiles of:
-- 1. Your own profile
-- 2. Users you share ANY event with (not just active ones)
-- 3. Users you have matched with
CREATE POLICY "Users can view profiles of matched users and shared events"
ON profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR users_share_event(auth.uid(), user_id)
  OR EXISTS (
    SELECT 1 FROM matches
    WHERE (matches.user1_id = auth.uid() AND matches.user2_id = profiles.user_id)
       OR (matches.user2_id = auth.uid() AND matches.user1_id = profiles.user_id)
  )
);