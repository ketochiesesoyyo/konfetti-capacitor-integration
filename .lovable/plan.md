

# Fix: Password Reset Redirect Not Working

## Problem

When clicking "Reset Password" in the email, the user gets stuck on a Supabase auth cloud URL instead of being redirected to the app's password reset page. Two issues cause this:

1. **`ResetPassword.tsx` session detection**: The page calls `getSession()` immediately on mount, but the Supabase client hasn't yet processed the recovery tokens from the URL hash fragment (`#access_token=...&type=recovery`). Since no session is found, it redirects to `/auth` before the token can be consumed. It needs to use `onAuthStateChange` to listen for the `PASSWORD_RECOVERY` event.

2. **`Auth.tsx` redirect URL**: The forgot password handler uses `window.location.origin` for the `redirectTo` parameter. This resolves to the preview/staging domain, not `konfetti.app`. The published app URL should be used.

## Solution

### File 1: `src/pages/ResetPassword.tsx`

Replace the `useEffect` session check with an `onAuthStateChange` listener:

- Listen for the `PASSWORD_RECOVERY` event (fired when Supabase processes the recovery token from the URL hash)
- Also handle `SIGNED_IN` as a fallback (some flows emit this instead)
- Add a timeout so if no auth event fires within ~5 seconds, show the invalid link error
- Clean up the subscription on unmount

### File 2: `src/pages/Auth.tsx`

Update the `redirectTo` in `handleForgotPassword` to use the published app URL:

```
redirectTo: `https://konfetti.app/reset-password`
```

This ensures the Supabase auth system redirects to the correct production domain regardless of where the user triggered the reset from.

## Technical Details

The Supabase password recovery flow works as follows:

```text
1. User clicks "Reset Password" in email
2. Browser opens {{ .ConfirmationURL }} (Supabase auth endpoint)
3. Supabase validates token
4. Supabase redirects to redirectTo URL with tokens in hash fragment:
   https://konfetti.app/reset-password#access_token=...&type=recovery
5. Supabase JS client detects hash tokens on page load
6. onAuthStateChange fires PASSWORD_RECOVERY event
7. ResetPassword page detects event, shows password form
8. User submits new password via supabase.auth.updateUser()
```

The current code breaks at step 6-7 because it uses `getSession()` (which runs before the hash tokens are processed) instead of listening for the auth state change event.

## Files Modified
- `src/pages/ResetPassword.tsx` -- rewrite useEffect to use onAuthStateChange
- `src/pages/Auth.tsx` -- update redirectTo URL in handleForgotPassword
