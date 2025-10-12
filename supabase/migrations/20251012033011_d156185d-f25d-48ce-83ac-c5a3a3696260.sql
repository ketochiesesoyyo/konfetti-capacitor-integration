-- Create reports table for tracking user reports
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  match_id UUID NOT NULL,
  event_id UUID NOT NULL,
  reason TEXT NOT NULL,
  custom_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Event hosts can view reports for their events
CREATE POLICY "Event hosts can view reports for their events"
ON public.reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM events
    WHERE events.id = reports.event_id
    AND events.created_by = auth.uid()
  )
);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.reports
FOR SELECT
USING (auth.uid() = reporter_id);