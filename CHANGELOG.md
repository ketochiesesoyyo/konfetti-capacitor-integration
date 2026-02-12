# Changelog

All notable changes to the Konfetti project are documented here.

Format: dates in YYYY-MM-DD, grouped by category.

---

## 2026-02-11

### Admin Dashboard — Contact Detail Page Redesign (`/admin/client/:id`)

**Goal:** Redesign the contact detail page to match the company detail page layout, prominently showing which company/agency the contact belongs to.

**Files changed:**
- `src/pages/AdminClientDetail.tsx` — Full layout redesign: back button header with name + status/type badges + clickable company link, 4 stats cards (events, guests, paid revenue, pending revenue), two-column grid with contact info + portal status + notes cards, enriched events table with price and payment status columns

**Status:** Deployed to `admin.konfetti.app` via Vercel.

### Admin Dashboard — Company Phone, Email & Regions Covered

**Goal:** Add company-level phone and email fields (independent of individual contacts), and surface the existing `regions_covered` array for companies that operate in multiple cities.

**Database migration:**
- `supabase/migrations/20260211220000_add_company_phone_email.sql` — Added `phone` and `email` columns to `companies` table

**Files changed:**
- `src/integrations/supabase/types.ts` — Added `phone` and `email` to companies Row/Insert/Update types
- `src/components/admin/tabs/CompaniesTab.tsx` — Added phone/email fields to create/edit dialogs under "Información General"; added "Ciudades / Regiones que cubre" comma-separated input under "Ubicación"; city label clarified to "Ciudad (sede)"
- `src/pages/AdminCompanyDetail.tsx` — Phone/email displayed in header subtitle; regions covered shown as badges in company profile card; phone/email/regions editable in edit dialog

**Status:** Deployed to `admin.konfetti.app` via Vercel. Migration run via Supabase SQL Editor.

### Admin Dashboard — Analytics Tab (`/admin/analytics`)

**Goal:** Add P1 analytics capabilities to the admin dashboard: cohort analysis, net revenue retention, and revenue concentration tracking for wedding planner companies.

**Files changed:**
- `src/App.tsx` — Added `/admin/analytics` route
- `src/components/admin/AdminContent.tsx` — Added `analytics` to active tab union, section title, and render block
- `src/components/admin/AdminLayout.tsx` — Added `analytics` to `getActiveSection()` and `handleSectionChange()`
- `src/components/admin/AdminSidebar.tsx` — Added "Análisis" nav item with `TrendingUp` icon under "Financiero" section

**Files created:**
- `src/components/admin/tabs/AnalyticsTab.tsx` — Full analytics tab with three sections:
  - **KPI cards:** Empresas Activas, NRR (12m with 6m fallback), Revenue Concentration (color-coded thresholds)
  - **Cohort Retention Table:** Toggle between Bodas / Ingresos / Retención % views; triangular layout, color-coded retention cells, churn detection badges
  - **Pareto Chart:** ComposedChart with revenue bars + cumulative % line, 80% reference line, dependency alerts (amber >30%, red >50%)

**Technical notes:**
- Zero additional Supabase queries — all metrics computed client-side via `useMemo` from existing `hostedEvents` and `clients` data
- Data joined by `contact_id` → `company_id` to map events to companies
- Multi-currency support in revenue display

**Status:** Deployed to `admin.konfetti.app` via Vercel.

### Admin Dashboard — Enriched Company Profiles (`/admin/companies`, `/admin/company/:id`)

**Goal:** Expand the companies/empresas section from a basic name+notes table into a full CRM profile for wedding planner companies, with social links, location, business details, and a dedicated detail page.

**Database migration:**
- `supabase/migrations/20260211180000_enrich_companies_table.sql` — Added 21 new columns to `companies` table:
  - Social: `website`, `instagram`, `linkedin`, `facebook`, `pinterest`, `tiktok`
  - Location: `country`, `city`, `state`, `regions_covered`
  - Business: `employee_count`, `year_founded`, `logo_url`, `tax_id`
  - Wedding planner: `price_tier`, `avg_weddings_per_year`, `avg_guest_count`, `specialties`
  - Relationship: `partnership_tier`, `referral_source`, `commission_rate`

**Files changed:**
- `src/integrations/supabase/types.ts` — Updated `companies` Row/Insert/Update types with all new fields
- `src/components/admin/tabs/CompaniesTab.tsx` — Enriched table (Location, Tier, Social columns), full create/edit dialogs with 5 sections, clickable rows to detail page, search by name/city/country
- `src/App.tsx` — Added lazy import + route for `AdminCompanyDetail`
- `src/components/admin/AdminLayout.tsx` — Added `/admin/company/` path to sidebar highlight

**Files created:**
- `src/pages/AdminCompanyDetail.tsx` — Company detail page with:
  - Stats cards (contacts, events, paid revenue, pending revenue)
  - Company profile card (segment, referral source, commission, employees, year founded, RFC)
  - Wedding planner profile card (weddings/year, avg guests, specialties badges)
  - Social links card with clickable external links
  - Contacts table (clickable to client detail)
  - Events table (clickable to event dashboard)
  - Full inline edit dialog

**Status:** Deployed to `admin.konfetti.app` via Vercel. Migration run via Supabase SQL Editor.

---

## 2025-02-11

### Admin Dashboard — Vercel Deployment (`admin.konfetti.app`)

**Goal:** Make admin panel accessible at `admin.konfetti.app` via Vercel free tier, with auto-redirect to admin login/dashboard.

**Files changed:**
- `src/lib/domain.ts` — Added `admin.konfetti.app` to `ADMIN_ALLOWED_DOMAINS`; added `isAdminSubdomain()` helper
- `src/App.tsx` — `IndexRedirect` now redirects `/` → `/admin` when on admin subdomain
- `src/pages/Auth.tsx` — Post-login redirects to `/admin` instead of `/profile` when on admin subdomain

**Files created:**
- `vercel.json` — SPA rewrite rule so client-side routes work on page refresh

**Flow:** `admin.konfetti.app` → `/` → `/admin` → AdminLayout (auth check) → login if needed → admin panel

**Infrastructure (manual):**
- [ ] Vercel: Import repo, set env vars (`VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`)
- [ ] Vercel: Add `admin.konfetti.app` as custom domain
- [ ] Namecheap: CNAME record — Host: `admin`, Value: `cname.vercel-dns.com`
- [ ] Supabase: Add `https://admin.konfetti.app` to Authentication → Redirect URLs
- [ ] Push code changes to GitHub

**Status:** Code complete. Waiting on Lovable support for Supabase redirect URL configuration.
