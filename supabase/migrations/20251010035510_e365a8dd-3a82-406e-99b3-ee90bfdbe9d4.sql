-- Add foreign key from swipes to profiles
ALTER TABLE public.swipes 
ADD CONSTRAINT swipes_user_id_profiles_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Add foreign key from matches to profiles
ALTER TABLE public.matches 
ADD CONSTRAINT matches_user1_id_profiles_fkey 
FOREIGN KEY (user1_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

ALTER TABLE public.matches 
ADD CONSTRAINT matches_user2_id_profiles_fkey 
FOREIGN KEY (user2_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;