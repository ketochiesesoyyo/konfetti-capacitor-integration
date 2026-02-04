-- Create clients table for CRM functionality
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_type TEXT NOT NULL DEFAULT 'couple' CHECK (client_type IN ('couple', 'wedding_planner')),
  contact_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  source_request_id UUID REFERENCES public.event_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add client_id to events table
ALTER TABLE public.events ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS policies for clients (admin only)
CREATE POLICY "Admins can view clients"
  ON public.clients FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create clients"
  ON public.clients FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clients"
  ON public.clients FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clients"
  ON public.clients FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data: create clients from event_requests that have event_id
INSERT INTO public.clients (client_type, contact_name, email, phone, source_request_id)
SELECT 
  er.submitter_type,
  COALESCE(er.contact_name, er.partner1_name || ' & ' || er.partner2_name),
  er.email,
  er.phone,
  er.id
FROM public.event_requests er
WHERE er.event_id IS NOT NULL;

-- Link events to their new client records
UPDATE public.events e
SET client_id = c.id
FROM public.clients c
JOIN public.event_requests er ON c.source_request_id = er.id
WHERE er.event_id = e.id;