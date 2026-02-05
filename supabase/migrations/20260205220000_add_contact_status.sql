-- Add status and archived_at fields to contacts table
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
