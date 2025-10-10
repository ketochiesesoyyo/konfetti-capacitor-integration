-- Create a secure view that masks invite codes from non-creators
CREATE OR REPLACE VIEW public.events_secure AS
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

-- Grant permissions on the view
GRANT SELECT ON public.events_secure TO authenticated;

-- Add RLS to the view
ALTER VIEW public.events_secure SET (security_invoker = true);

-- Add comment explaining the security measure
COMMENT ON VIEW public.events_secure IS 
'Secure view of events that masks invite_code from non-creators to prevent unauthorized sharing';