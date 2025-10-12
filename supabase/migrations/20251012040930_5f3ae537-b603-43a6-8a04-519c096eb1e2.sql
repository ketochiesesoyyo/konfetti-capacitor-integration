-- Create table to log when users leave events
CREATE TABLE public.event_departures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  reason TEXT,
  left_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_departures ENABLE ROW LEVEL SECURITY;

-- Event hosts can view departures from their events
CREATE POLICY "Event hosts can view departures"
ON public.event_departures
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_departures.event_id
    AND events.created_by = auth.uid()
  )
);

-- Users can log their own departures
CREATE POLICY "Users can log their own departures"
ON public.event_departures
FOR INSERT
WITH CHECK (auth.uid() = user_id);