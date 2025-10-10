-- Create swipes table for tracking user swipes
CREATE TABLE public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  swiped_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, swiped_user_id, event_id)
);

-- Create matches table for tracking matches between users
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id, event_id)
);

-- Add status column to events table
ALTER TABLE public.events ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed'));

-- Enable RLS on new tables
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- RLS policies for swipes
CREATE POLICY "Users can view swipes in their events"
ON public.swipes
FOR SELECT
TO authenticated
USING (user_is_event_attendee(auth.uid(), event_id));

CREATE POLICY "Users can create swipes in their events"
ON public.swipes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND 
  user_is_event_attendee(auth.uid(), event_id)
);

-- RLS policies for matches
CREATE POLICY "Users can view matches in their events"
ON public.matches
FOR SELECT
TO authenticated
USING (
  (user1_id = auth.uid() OR user2_id = auth.uid()) AND
  user_is_event_attendee(auth.uid(), event_id)
);

CREATE POLICY "Users can create matches in their events"
ON public.matches
FOR INSERT
TO authenticated
WITH CHECK (
  (user1_id = auth.uid() OR user2_id = auth.uid()) AND
  user_is_event_attendee(auth.uid(), event_id)
);

-- Create indexes for performance
CREATE INDEX idx_swipes_event_id ON public.swipes(event_id);
CREATE INDEX idx_swipes_user_id ON public.swipes(user_id);
CREATE INDEX idx_matches_event_id ON public.matches(event_id);
CREATE INDEX idx_matches_users ON public.matches(user1_id, user2_id);