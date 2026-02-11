# Changelog

All notable changes to the Konfetti project are documented here.

Format: dates in YYYY-MM-DD, grouped by category.

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
