

## Admin Panel CRM Enhancement: Client Management System

### Current State Analysis

Your Admin Panel currently has:
- **Event Requests (Solicitudes)**: Captures leads with partner names, wedding date, expected guests, email, phone, submitter_type (couple/wedding_planner), and contact_name
- **Events**: Created from requests, linked via `event_id` in `event_requests` table
- **Problem**: When you create an event directly (without a request), there's no client/contact info attached to it

### The Gap

Currently, events created directly from the "Crear Evento" button have **no client relationship** - you lose track of:
- Who is your client contact?
- Are they a couple or a wedding planner?
- What company does the planner work for?
- Contact details for billing/communication

---

### Proposed Solution: `clients` Table

Create a dedicated **clients** table that serves as the CRM backbone, separate from event_requests (which is for lead capture).

```text
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Event Request Form    ──►   event_requests   ──┐              │
│  (Public lead capture)       (Lead data)        │              │
│                                                 ▼              │
│                                            ┌─────────┐         │
│                                            │ clients │         │
│                                            └────┬────┘         │
│                                                 │              │
│  Admin creates event  ────────────────────────►─┘              │
│                                                 │              │
│                                                 ▼              │
│                                            ┌─────────┐         │
│                                            │ events  │         │
│                                            └─────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Database Schema: `clients` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `client_type` | TEXT | `couple` or `wedding_planner` |
| `contact_name` | TEXT | Primary contact person name |
| `company_name` | TEXT | Company name (for wedding planners), NULL for couples |
| `email` | TEXT | Contact email |
| `phone` | TEXT | Contact phone |
| `notes` | TEXT | Internal notes about the client |
| `source_request_id` | UUID | Link to original event_request (if came from a lead) |
| `created_at` | TIMESTAMPTZ | When client was created |
| `updated_at` | TIMESTAMPTZ | Last update |

**And add to `events` table:**
| Column | Type | Description |
|--------|------|-------------|
| `client_id` | UUID | Foreign key to clients table |

---

### UI Changes

#### 1. Enhanced Event Creation Dialog

When clicking "Crear Evento", the dialog will have a **Client Information** section:

```text
┌────────────────────────────────────────────────────────┐
│              Crear Evento                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ── INFORMACIÓN DEL CLIENTE ──────────────────────    │
│                                                        │
│  Tipo de Cliente:  [ Pareja ▼ ]                       │
│                                                        │
│  Nombre de Contacto: [___________________________]    │
│                                                        │
│  Empresa (opcional): [___________________________]    │
│        (visible only when Wedding Planner selected)   │
│                                                        │
│  Email: [___________________________]                 │
│  Teléfono: [___________________________]              │
│                                                        │
│  ── INFORMACIÓN DEL EVENTO ───────────────────────    │
│                                                        │
│  Nombre 1: [__________]    Nombre 2: [__________]     │
│  Fecha del Evento: [__________]                       │
│  Imagen: [ Upload ]                                   │
│                                                        │
│             [ Cancelar ]  [ Crear Evento ]            │
└────────────────────────────────────────────────────────┘
```

#### 2. Events Table Enhancement

Add a "Cliente" column to the Events tab showing the client relationship:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Evento           │ Cliente              │ Fecha      │ Estado  │ Código │
├──────────────────────────────────────────────────────────────────────────┤
│ Ana & Carlos     │ 👤 María García      │ 15 Mar 26  │ Activo  │ ANA... │
│                  │ La Boda Perfecta     │            │         │        │
├──────────────────────────────────────────────────────────────────────────┤
│ Laura & Pedro    │ 💍 Laura Martínez    │ 22 Apr 26  │ Activo  │ LAU... │
│                  │ (Pareja)             │            │         │        │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 3. Client Details in Event Dashboard

Add a collapsible "Información del Cliente" card in the Event Dashboard settings tab showing:
- Client type badge
- Contact name and company (if planner)
- Email and phone (clickable)
- Link to original lead request (if exists)

---

### Migration Path for Existing Data

When deploying, we need to:
1. Create the `clients` table
2. Auto-generate client records from existing `event_requests` that have `event_id`
3. Link those clients to their respective events

```sql
-- Migration pseudo-code
INSERT INTO clients (client_type, contact_name, email, phone, source_request_id)
SELECT 
  submitter_type,
  COALESCE(contact_name, partner1_name || ' ' || partner2_name),
  email,
  phone,
  id
FROM event_requests
WHERE event_id IS NOT NULL;
```

---

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | `clients` table + add `client_id` to events + data migration |
| `src/components/admin/AdminEventCreationDialog.tsx` | Modify | Add client info fields |
| `src/pages/Admin.tsx` | Modify | Add Client column to Events table, show client info |
| `src/pages/EventDashboard.tsx` | Modify | Add client info card in settings |
| `src/integrations/supabase/types.ts` | Auto-updated | New types for clients |

---

### How It Works Together

**Scenario A: Lead comes through Contact form**
1. User submits form → `event_requests` record created
2. Admin sees lead in "Solicitudes" tab
3. Admin clicks "Crear Evento" on the lead
4. System auto-creates a `client` from request data
5. Event is created with `client_id` link
6. Original `event_request.event_id` is updated

**Scenario B: Admin creates event directly**
1. Admin clicks "Crear Evento" button (no lead)
2. Dialog shows client info section (must fill out)
3. System creates `client` record first
4. Then creates event with `client_id` link

**Viewing client info:**
- Events table shows client name + company
- Event Dashboard has client info card
- Clicking client name could (future) open full client history

---

### Future CRM Enhancements (not in this plan)

- Client listing page (all clients)
- Multiple events per client (repeat customers)
- Client notes and interaction history
- Payment tracking per client
- Email templates per client

