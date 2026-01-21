-- Create table for event requests from the contact form
CREATE TABLE public.event_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner1_name TEXT NOT NULL,
  partner2_name TEXT NOT NULL,
  wedding_date DATE NOT NULL,
  expected_guests INTEGER NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a request (public form)
CREATE POLICY "Anyone can submit event requests"
ON public.event_requests
FOR INSERT
WITH CHECK (true);

-- Only admins can view requests (we'll check via user_roles)
CREATE POLICY "Admins can view event requests"
ON public.event_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can update requests
CREATE POLICY "Admins can update event requests"
ON public.event_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_event_requests_updated_at
BEFORE UPDATE ON public.event_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();