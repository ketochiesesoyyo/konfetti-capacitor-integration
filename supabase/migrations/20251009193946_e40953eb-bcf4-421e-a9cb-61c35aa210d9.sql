-- Create events table
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  date date NOT NULL,
  description text,
  invite_code text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create event_attendees junction table
CREATE TABLE public.event_attendees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check if two users share an event
CREATE OR REPLACE FUNCTION public.users_share_event(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_attendees ea1
    INNER JOIN public.event_attendees ea2 ON ea1.event_id = ea2.event_id
    WHERE ea1.user_id = user_a
      AND ea2.user_id = user_b
  );
$$;

-- RLS Policies for events table
CREATE POLICY "Users can view events they attend"
  ON public.events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_attendees
      WHERE event_id = events.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events"
  ON public.events
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Event creators can update their events"
  ON public.events
  FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for event_attendees table
CREATE POLICY "Users can view attendees of their events"
  ON public.event_attendees
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_attendees ea
      WHERE ea.event_id = event_attendees.event_id
        AND ea.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join events"
  ON public.event_attendees
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update the profiles SELECT policy to restrict to same-event users
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view profiles of people in same events"
  ON public.profiles
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR public.users_share_event(auth.uid(), user_id)
  );

-- Add trigger for events updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();