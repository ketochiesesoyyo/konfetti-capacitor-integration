-- Create hidden_events table
CREATE TABLE public.hidden_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  hidden_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.hidden_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own hidden events
CREATE POLICY "Users can view their own hidden events"
ON public.hidden_events
FOR SELECT
USING (auth.uid() = user_id);

-- Users can hide events
CREATE POLICY "Users can hide events"
ON public.hidden_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unhide their own events
CREATE POLICY "Users can unhide their own events"
ON public.hidden_events
FOR DELETE
USING (auth.uid() = user_id);