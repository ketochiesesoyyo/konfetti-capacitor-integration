-- Add financial tracking fields to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS price decimal(10,2);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'MXN';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS commission_type text; -- 'percentage' or 'fixed'
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS commission_value decimal(10,2);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payment_date date;

-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_events_payment_status ON public.events(payment_status);

-- Add check constraint for valid currency
ALTER TABLE public.events ADD CONSTRAINT chk_events_currency
  CHECK (currency IN ('MXN', 'USD', 'INR'));

-- Add check constraint for valid payment status
ALTER TABLE public.events ADD CONSTRAINT chk_events_payment_status
  CHECK (payment_status IN ('pending', 'partial', 'paid'));

-- Add check constraint for valid commission type
ALTER TABLE public.events ADD CONSTRAINT chk_events_commission_type
  CHECK (commission_type IS NULL OR commission_type IN ('percentage', 'fixed'));
