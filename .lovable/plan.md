
Goal: Fix the production ("Published") admin panel so it can reliably (1) load Events, (2) load Clients/Contacts, and (3) create events — without the "Error al cargar Eventos / Clientes" failures.

## ✅ IMPLEMENTED

### 1) Diagnostics Panel (src/components/admin/AdminDiagnosticsPanel.tsx)
- Shows captured errors with reference codes
- Displays schema compatibility checks
- Shows current environment (Preview/Published)
- Shows if fallback queries were used
- Only visible when there are issues

### 2) Schema Compatibility Check (src/hooks/useAdminQueries.ts)
- Checks events.contact_id column exists
- Checks contacts table access
- Checks companies table access
- Checks event_attendees access
- Shows clear banner if Live schema is behind

### 3) Hardened Queries with Fallbacks (src/hooks/useAdminQueries.ts)
- loadHostedEventsHardened: Primary relational join, falls back to 2-step fetch
- loadContactsHardened: Primary join with companies, falls back to plain fetch
- loadCompaniesHardened: Simple fetch with error capture

### 4) Error Capture System (src/lib/adminDiagnostics.ts)
- Captures full error details (message, code, hint)
- Stores last 20 errors for debugging
- Generates short reference codes for user display
- Detects schema-related errors automatically

## What to do next:

1. **Go to Published /admin**
2. If errors appear, the Diagnostics Panel will show:
   - The exact error message and code
   - Which schema checks failed
   - Whether the Live environment needs publishing
3. If schema checks fail with "does not exist" errors → **Publish to sync Live with Test**
4. If RLS errors appear → A migration may be needed to add admin bypass clauses

## Files Changed:
- src/pages/Admin.tsx - Uses hardened queries, added diagnostics panel
- src/hooks/useAdminQueries.ts - NEW: Hardened query functions
- src/lib/adminDiagnostics.ts - NEW: Error capture and diagnostics utilities
- src/components/admin/AdminDiagnosticsPanel.tsx - NEW: Visual diagnostics UI
