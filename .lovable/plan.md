

# Fix: Password Reset Email Missing Button

## Problem

The password reset email shows the text "Click the button below to choose a new one:" but there is no button. This is because no custom email template is configured for password recovery -- the system default is not rendering the link properly.

## Solution

Add a custom HTML email template for the recovery flow in `supabase/config.toml`. This template will include:

- Konfetti branding (logo, colors)
- A visible, styled "Reset Password" button linking to `{{ .ConfirmationURL }}`
- Bilingual support (English primary, with Spanish note if desired)
- Consistent styling with your other notification emails

## Technical Details

### File: `supabase/config.toml`

Add an `[auth.email.template.recovery]` section with:
- `subject`: "Reset your password"
- `content_path`: pointing to a local HTML template file (e.g., `./supabase/templates/recovery.html`)

### File: `supabase/templates/recovery.html` (new)

A branded HTML email template containing:
- Konfetti logo header
- "Reset your password" heading
- Explanatory text
- A prominent styled button with `href="{{ .ConfirmationURL }}"`
- Fallback plain-text link below the button
- "If you didn't request this..." disclaimer
- Footer matching the style of your other email notifications

### Key Variable

The critical piece is `{{ .ConfirmationURL }}` -- this is the Supabase-provided magic link that authenticates the user and redirects them to `/reset-password` (as configured in your `Auth.tsx` forgot password handler with `redirectTo: window.location.origin/reset-password`).

## What Won't Change

- The frontend reset password page (`src/pages/ResetPassword.tsx`) stays the same
- The forgot password logic in `src/pages/Auth.tsx` stays the same
- No database changes needed

## Files Modified
- 1 file modified: `supabase/config.toml`
- 1 file created: `supabase/templates/recovery.html`

