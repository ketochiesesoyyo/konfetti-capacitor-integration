-- Create companies table for wedding planning businesses
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- RLS policies for companies (admin only)
CREATE POLICY "Admins can view companies" ON public.companies
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create companies" ON public.companies
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update companies" ON public.companies
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete companies" ON public.companies
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create contacts table (replaces clients)
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_type TEXT NOT NULL DEFAULT 'couple',
  email TEXT,
  phone TEXT,
  notes TEXT,
  source_request_id UUID REFERENCES public.event_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for contacts (admin only)
CREATE POLICY "Admins can view contacts" ON public.contacts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create contacts" ON public.contacts
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update contacts" ON public.contacts
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete contacts" ON public.contacts
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add contact_id to events (will replace client_id)
ALTER TABLE public.events ADD COLUMN contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

-- Migrate existing clients data to new structure
-- First, create companies from unique company_names in clients where client_type = 'wedding_planner'
INSERT INTO public.companies (name, notes, created_at, updated_at)
SELECT DISTINCT 
  company_name,
  NULL,
  MIN(created_at),
  MAX(updated_at)
FROM public.clients 
WHERE company_name IS NOT NULL AND company_name != ''
GROUP BY company_name;

-- Now create contacts from existing clients
INSERT INTO public.contacts (contact_name, contact_type, email, phone, notes, source_request_id, company_id, created_at, updated_at)
SELECT 
  c.contact_name,
  c.client_type,
  c.email,
  c.phone,
  c.notes,
  c.source_request_id,
  comp.id,
  c.created_at,
  c.updated_at
FROM public.clients c
LEFT JOIN public.companies comp ON comp.name = c.company_name;

-- Update events to use new contact_id based on old client_id
UPDATE public.events e
SET contact_id = cont.id
FROM public.clients c
JOIN public.contacts cont ON cont.contact_name = c.contact_name 
  AND COALESCE(cont.email, '') = COALESCE(c.email, '')
WHERE e.client_id = c.id;

-- Add updated_at trigger for companies
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for contacts
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Now we can drop the old client_id column and clients table
-- First drop the foreign key constraint on events
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_client_id_fkey;
ALTER TABLE public.events DROP COLUMN client_id;

-- Drop the old clients table
DROP TABLE public.clients;