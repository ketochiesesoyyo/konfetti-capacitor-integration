-- Add user_id and invited_at columns to contacts for portal linking
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- Unique index on user_id (only where not null) to enforce one contact per auth user
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id) WHERE user_id IS NOT NULL;

-- Index on email for fast lookup during auto-link trigger
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email) WHERE email IS NOT NULL;
