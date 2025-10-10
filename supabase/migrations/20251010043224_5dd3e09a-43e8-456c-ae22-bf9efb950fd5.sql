-- Drop existing foreign keys and recreate them correctly

-- Drop old foreign keys from matches table
ALTER TABLE public.matches
DROP CONSTRAINT IF EXISTS matches_user1_id_fkey;

ALTER TABLE public.matches
DROP CONSTRAINT IF EXISTS matches_user2_id_fkey;

-- Drop old foreign keys from swipes table
ALTER TABLE public.swipes
DROP CONSTRAINT IF EXISTS swipes_user_id_fkey;

ALTER TABLE public.swipes
DROP CONSTRAINT IF EXISTS swipes_swiped_user_id_fkey;

-- Recreate foreign keys pointing to profiles.user_id (not profiles.id)
ALTER TABLE public.matches
ADD CONSTRAINT matches_user1_id_fkey 
FOREIGN KEY (user1_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.matches
ADD CONSTRAINT matches_user2_id_fkey 
FOREIGN KEY (user2_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.swipes
ADD CONSTRAINT swipes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.swipes
ADD CONSTRAINT swipes_swiped_user_id_fkey 
FOREIGN KEY (swiped_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;