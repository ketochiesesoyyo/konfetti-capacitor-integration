-- EVENTS: replace restrictive policy with one that also allows admins
DROP POLICY IF EXISTS "Authenticated users can view their events" ON public.events;
CREATE POLICY "Authenticated users can view their events"
ON public.events
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  (auth.uid() IS NOT NULL)
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

-- EVENT_ATTENDEES: replace restrictive policy with one that also allows admins
DROP POLICY IF EXISTS "Users can view attendees of their events" ON public.event_attendees;
CREATE POLICY "Users can view attendees of their events"
ON public.event_attendees
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  user_is_event_attendee(auth.uid(), event_id)
  OR user_is_event_host(auth.uid(), event_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Optional cleanup: policies we added earlier are no longer needed after widening the restrictive ones
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "Admins can update all events" ON public.events;