
Goal: Fix the production (“Published”) admin panel so it can reliably (1) load Events, (2) load Clients/Contacts, and (3) create events — without the “Error al cargar Eventos / Clientes” failures.

What I believe is happening (most likely root cause)
- You are testing on the Published URL, which uses the Live environment.
- Many of the recent CRM schema changes (clients → contacts/companies, events.contact_id, updated RLS) were made in Test and/or with code that expects the new schema.
- If Live has not been fully updated/published to match the new schema + policies, production queries will hard-fail (not just return 0 rows) with errors like:
  - “column contact_id does not exist”
  - “Could not find relationship …” (if FKs/views differ)
  - RLS/permission errors
These hard failures match the behavior: toasts show the generic “Error al cargar …” (which only happens when Supabase returns an error, not when it returns empty arrays).

Plan of attack (fastest path to a guaranteed fix)

1) Confirm the production failure mode with better visibility (so we stop guessing)
   1.1 Add an “Admin Diagnostics” panel (visible only for admins) that captures and displays:
       - the exact error message/code from the backend
       - which query failed (Events load vs Contacts load vs Companies load)
       - current environment marker (Published vs Preview)
   1.2 Replace current generic toasts in Admin.tsx with centralized safe error handling:
       - In production: show a short user message plus a “Ref: …” code
       - In development/admin diagnostics: store the full error details (message, code, hint, query context)

   Why:
   - Right now the UI only shows a generic toast; without the raw error we cannot deterministically fix it.
   - This will also prevent future regressions from becoming “blind” failures.

2) Verify Live environment schema alignment (and fix it if it’s behind)
   2.1 Add a lightweight “schema compatibility check” that runs on entering /admin:
       - Attempt a tiny select that requires the new schema, e.g.:
         - events: select contact_id limit 1
         - contacts table exists
         - companies table exists
       - If the check fails with “column/table not found”, show a clear admin-only banner:
         “Backend schema in Live is behind the app version. Publish the latest backend changes.”
   2.2 If the compatibility check indicates Live is behind:
       - Publish so Live receives:
         - the CRM migration that creates companies/contacts and adds events.contact_id
         - the updated RLS policies for events/event_attendees/contacts/companies
       - After publishing, re-test production.

   Why:
   - This is the #1 cause of “works in preview, breaks in published” with database-backed apps.

3) Harden the admin queries to be robust across relational/RLS edge cases
   3.1 Events query (Admin.tsx → loadHostedEvents)
       - Keep the explicit FK join syntax for contacts:
         contacts!contact_id(...)
       - Ensure nested companies selection is correct and doesn’t crash if company is null.
       - Add a fallback: if the relational join fails (relationship ambiguity), run a two-step fetch:
         - fetch events (no joins)
         - fetch contacts for the event.contact_id set
         - fetch companies for contacts.company_id
         - map in memory
       This makes the admin panel resilient even if PostgREST relationship discovery differs in Live.

   3.2 Contacts query (Admin.tsx → loadContacts)
       - Similar hardening:
         - fetch contacts + companies (or do 2-step if join fails)
         - fetch events by contact_id
         - map in memory (you already do this mapping part, which is good)

   Why:
   - Admin views are management-critical; we can afford 2-step queries for reliability.

4) Ensure RLS policies are correct for admins in Live
   4.1 Validate in Live:
       - events SELECT allows admins
       - event_attendees SELECT allows admins (needed for attendee count)
       - contacts SELECT allows admins
       - companies SELECT allows admins
   4.2 If any policy is missing/misaligned in Live, apply a migration to correct it.
       - Keep admin access based on server-side role checks (has_role(auth.uid(), 'admin')).
       - Avoid “restrictive + permissive” traps by ensuring restrictive policies include the admin clause, as you started doing.

5) End-to-end verification checklist (production)
   After implementing the diagnostics + schema alignment + query hardening:
   - Go to Published /admin
   - Confirm:
     - Events tab loads and shows non-zero events
     - Contacts tab loads and shows non-zero contacts
     - “Crear Evento” succeeds (creates contact/company when needed, creates event, auto-joins creator)
     - Navigating into an event dashboard from admin works
   - If anything fails, the Diagnostics panel should show the precise error so the next fix is surgical.

Deliverables (what I will change once you approve)
- Frontend:
  - src/pages/Admin.tsx
    - Add diagnostic error capturing
    - Add schema compatibility check + admin-only banner
    - Harden loadHostedEvents/loadContacts with safe fallbacks
  - (Optional) small reusable helper in src/lib/errorHandling.ts usage to standardize admin error reporting
- Backend (only if diagnostics indicate Live policies are still wrong after publish):
  - A migration to adjust RLS policies for admin visibility (events, event_attendees, contacts, companies)

Risks / tradeoffs
- Two-step fallback queries are slightly more code and 1–2 extra network calls, but they dramatically increase reliability for the admin panel and reduce breakage risk across environments.
- If the root cause is “Live not published,” publishing is the real fix; diagnostics ensure we detect that immediately instead of repeatedly changing code/policies.

What I need from you during implementation
- After I add diagnostics, you’ll open Published /admin once and tell me what exact error appears in the Diagnostics panel (if it still fails). That will let us finalize the fix in minutes.

