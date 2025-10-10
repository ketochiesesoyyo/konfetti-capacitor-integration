-- Document the security model for events_secure view
-- Views in PostgreSQL inherit RLS from their underlying tables when security_invoker is set

-- Recreate the view with explicit security documentation
DROP VIEW IF EXISTS public.events_secure;

CREATE VIEW public.events_secure 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  description,
  date,
  close_date,
  status,
  created_by,
  created_at,
  updated_at,
  -- Only show invite_code to event creators
  CASE 
    WHEN created_by = auth.uid() THEN invite_code
    ELSE NULL
  END as invite_code
FROM public.events;

-- Ensure proper grants
GRANT SELECT ON public.events_secure TO authenticated;

-- Add comprehensive security documentation
COMMENT ON VIEW public.events_secure IS 
'Secure view of events with row-level security inherited from the events table.
This view respects the following security rules:
1. Users can only view events they created or are attending (enforced by events table RLS)
2. Invite codes are masked for non-creators (enforced by CASE statement in view)
3. security_invoker=true ensures the view runs with caller privileges, respecting underlying RLS policies

The underlying events table has these RLS policies:
- SELECT: Users can view events they attend or created
- INSERT: Users can create events
- UPDATE: Event creators can update their events

This view provides an additional security layer by masking sensitive invite_code data.';