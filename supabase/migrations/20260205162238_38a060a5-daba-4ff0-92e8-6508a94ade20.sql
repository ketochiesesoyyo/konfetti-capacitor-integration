-- Fix event visibility for authenticated users by hardening RLS policy semantics
-- Problem: existing SELECT policies were created as RESTRICTIVE (shown as Permissive: No), which can unintentionally AND-block access.

BEGIN;

-- event_attendees: replace SELECT policy with a PERMISSIVE one that also allows users to see their own rows
DROP POLICY IF EXISTS "Users can view attendees of their events" ON public.event_attendees;

CREATE POLICY "Users can view attendees of their events"
ON public.event_attendees
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR user_is_event_attendee(auth.uid(), event_id)
  OR user_is_event_host(auth.uid(), event_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- events: replace SELECT policy with PERMISSIVE + explicit TO authenticated
DROP POLICY IF EXISTS "Authenticated users can view their events" ON public.events;

CREATE POLICY "Authenticated users can view their events"
ON public.events
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.event_attendees ea
      WHERE ea.event_id = events.id
        AND ea.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

COMMIT;