-- Allow admins to view all events
CREATE POLICY "Admins can view all events"
ON public.events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update all events
CREATE POLICY "Admins can update all events"
ON public.events FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));