-- RLS policies for client portal access

-- Clients can read their own contact record
CREATE POLICY "clients_read_own_contact"
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Clients can read events linked to their contact
CREATE POLICY "clients_read_own_events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    contact_id IN (
      SELECT id FROM public.contacts WHERE user_id = auth.uid()
    )
  );

-- Clients can read event_attendees for their events
CREATE POLICY "clients_read_own_event_attendees"
  ON public.event_attendees
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM public.events e
      JOIN public.contacts c ON e.contact_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Clients can read matches for their events (count only in practice)
CREATE POLICY "clients_read_own_event_matches"
  ON public.matches
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM public.events e
      JOIN public.contacts c ON e.contact_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Clients can insert event requests
CREATE POLICY "clients_insert_event_requests"
  ON public.event_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Auto-link trigger: when a new user signs up, check if their email matches an invited contact
CREATE OR REPLACE FUNCTION public.link_contact_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if there's an invited contact with matching email and no user_id yet
  UPDATE public.contacts
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND invited_at IS NOT NULL
    AND user_id IS NULL;

  -- If a contact was linked, assign the 'client' role
  IF FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created_link_contact ON auth.users;
CREATE TRIGGER on_auth_user_created_link_contact
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_contact_on_signup();
