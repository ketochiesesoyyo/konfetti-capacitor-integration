
# Plan: Stop Auto-Joining Host as Attendee on Event Creation

## Summary

When you create an event as admin, the system currently auto-adds you to `event_attendees`. This causes you to appear as a guest in your own events - both in the Admin Dashboard's guest list and in the native app's "Attending Events" list. This plan removes that auto-join behavior.

---

## What Will Change

| File | Change |
|------|--------|
| `src/components/admin/AdminEventCreationDialog.tsx` | Remove the "auto-join creator to event" code block (lines 492-498) |

---

## Technical Details

### Current Behavior (Lines 492-498 in AdminEventCreationDialog.tsx)
```typescript
// Auto-join creator to event
await supabase
  .from("event_attendees")
  .insert({
    event_id: event.id,
    user_id: userId,
  });
```

### New Behavior
This code block will be removed entirely. The host (you) will only be recorded as `created_by` in the `events` table, NOT as an attendee in `event_attendees`.

---

## Why This Is Safe

1. **Admin Dashboard Access**: The Admin Dashboard (`AdminEventDashboard.tsx`) already checks `created_by` to verify you own the event (line 161-162), not `event_attendees`.

2. **Home Page Already Filters**: The `Home.tsx` page already filters out events where `created_by === user.id` (lines 114-117), so even if there were residual attendee records, they'd be hidden on web. Removing the auto-join makes this consistent across web and native.

3. **Matchmaking Already Excludes Host**: The matchmaking logic already excludes `hostId` from the swipe pool (line 326-328 in `Matchmaking.tsx`), so you're already protected there. This change adds an extra layer of protection.

4. **RLS Policies**: Your admin role grants access via `has_role(auth.uid(), 'admin')` in RLS policies, not via `event_attendees`.

---

## Additional Considerations

### Existing Attendee Records
You may have existing `event_attendees` records from events you've already created. These won't be automatically removed by this change. If you want to clean those up, I can provide a SQL query to run manually:

```sql
-- Optional cleanup: Remove host from their own events
DELETE FROM event_attendees
WHERE user_id IN (
  SELECT created_by FROM events WHERE created_by = event_attendees.user_id AND event_id = event_attendees.event_id
);
```

---

## Files Modified
- 1 file modified: `src/components/admin/AdminEventCreationDialog.tsx`

---

## What Won't Break

- Admin Dashboard access to events (uses `created_by`)
- Admin Dashboard guest list (will now show only real guests)
- Matchmaking exclusion (already protected by `hostId` filter)
- Native iOS/Android app (events you create won't appear in "Attending")
- Chat functionality between host and guests (uses RLS policies based on event ownership)
