
# Plan: Increase Photo Upload Limits from 5MB to 10MB

## Overview
This plan increases the client-side file size validation limit from 5MB to 10MB across all photo upload locations in the application. 

**To your question**: Yes, this change applies to the **webapp only**. Since this is a Capacitor-based hybrid app, the same React code runs both in the web browser and inside the iOS/Android native shells. The upload limit is enforced by JavaScript validation, so the change will apply wherever the app runs (web, iOS app, Android app) - they all share the same codebase.

---

## What Will Be Changed

### Files to Modify

| File | Current Limit | Change |
|------|---------------|--------|
| `src/pages/EditProfile.tsx` | 5MB (5242880 bytes) | → 10MB (10485760 bytes) |
| `src/pages/CreateEvent.tsx` | 5MB (3 locations) | → 10MB (10485760 bytes) |
| `src/components/admin/AdminEventCreationDialog.tsx` | 5MB | → 10MB (10485760 bytes) |

### Files Already at 10MB (No Changes Needed)
- `src/pages/EventDashboard.tsx` - Already 10MB ✓
- `src/pages/AdminEventDashboard.tsx` - Already 10MB ✓

---

## Build Error Fix (Required)
There's a TypeScript error that needs to be fixed first:

**Issue**: The `Contact` interface in `Admin.tsx` is missing `user_id` and `invited_at` fields that exist in `ClientsTab.tsx`.

**Fix**: Add the missing fields to `Admin.tsx`:
```typescript
interface Contact {
  // ... existing fields ...
  user_id: string | null;      // Add this
  invited_at: string | null;   // Add this
}
```

---

## Technical Details

### Changes in EditProfile.tsx (Line 406)
```typescript
// Before
if (file.size > 5242880) {
  toast.error("Photo must be less than 5MB");

// After  
if (file.size > 10485760) {
  toast.error("Photo must be less than 10MB");
```

### Changes in CreateEvent.tsx (Lines 428, 458, 570)
Three validation points will be updated from 5MB to 10MB.

### Changes in AdminEventCreationDialog.tsx (Line 240)
```typescript
// Before
if (file.size > 5242880) {
  toast.error("La foto debe ser menor a 5MB");

// After
if (file.size > 10485760) {
  toast.error("La foto debe ser menor a 10MB");
```

---

## Summary
- **4 files** will be modified
- **6 validation points** will be updated from 5MB to 10MB
- **1 build error** will be fixed (Contact interface mismatch)
- Changes apply to web, iOS app, and Android app (shared codebase)
