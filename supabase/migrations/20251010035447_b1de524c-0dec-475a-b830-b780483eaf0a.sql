-- Add foreign key from event_attendees to profiles
ALTER TABLE public.event_attendees 
ADD CONSTRAINT event_attendees_user_id_profiles_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;