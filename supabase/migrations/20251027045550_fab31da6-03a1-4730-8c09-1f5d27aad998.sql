-- Add matchmaking schedule columns to events table
ALTER TABLE public.events 
ADD COLUMN matchmaking_start_date DATE,
ADD COLUMN matchmaking_start_time TIME DEFAULT '09:00:00',
ADD COLUMN matchmaking_close_date DATE;

-- Add constraints for matchmaking dates
ALTER TABLE public.events 
ADD CONSTRAINT matchmaking_dates_valid 
CHECK (
  matchmaking_start_date IS NULL OR 
  matchmaking_close_date IS NULL OR 
  matchmaking_start_date <= matchmaking_close_date
);

-- Create notification_logs table to track sent emails
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, notification_type)
);

-- Enable RLS on notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_logs
CREATE POLICY "Event hosts can view notification logs" 
ON public.notification_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = notification_logs.event_id 
    AND events.created_by = auth.uid()
  )
);

CREATE POLICY "System can insert notification logs" 
ON public.notification_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster notification queries
CREATE INDEX idx_notification_logs_event_user ON public.notification_logs(event_id, user_id);
CREATE INDEX idx_events_matchmaking_dates ON public.events(matchmaking_start_date, matchmaking_close_date);

-- Update existing active events to set matchmaking_close_date = date where it's NULL
UPDATE public.events 
SET matchmaking_close_date = date 
WHERE matchmaking_close_date IS NULL AND date IS NOT NULL;

COMMENT ON COLUMN public.events.matchmaking_start_date IS 'When matchmaking opens (NULL means already open)';
COMMENT ON COLUMN public.events.matchmaking_start_time IS 'Time of day when matchmaking opens (default 9:00 AM)';
COMMENT ON COLUMN public.events.matchmaking_close_date IS 'When matchmaking closes (typically the event date)';
COMMENT ON TABLE public.notification_logs IS 'Tracks sent email notifications to prevent duplicates';