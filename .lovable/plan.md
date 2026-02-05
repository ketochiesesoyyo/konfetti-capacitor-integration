
# Plan: Fix Timezone Bug in Event Date Handling

## Problem
When creating an event for **February 28th**, it gets saved as **February 27th**. This is a classic JavaScript timezone issue.

## Root Cause
```typescript
const eventDate = new Date("2026-02-28"); // Interpreted as UTC midnight
closeDate.toISOString().split('T')[0];     // Converts back to UTC
```

When a user in a western timezone (e.g., America/Mexico_City at UTC-6) creates an event:
- `"2026-02-28"` is parsed as UTC midnight (00:00 UTC)
- That's `2026-02-27 18:00` in Mexico
- When converting with `toISOString()`, it shifts the date

## Solution
Use **local date components** instead of `toISOString()` which uses UTC. Create helper functions:

```typescript
// Convert Date to YYYY-MM-DD using LOCAL timezone
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Parse YYYY-MM-DD string to local Date (not UTC)
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}
```

## Files to Modify

### 1. `src/lib/utils.ts`
Add two helper functions for timezone-safe date handling:
- `formatLocalDate(date: Date): string` - formats date to YYYY-MM-DD in local timezone
- `parseLocalDate(dateStr: string): Date` - parses YYYY-MM-DD string to local Date object

### 2. `src/components/admin/AdminEventCreationDialog.tsx`
Update 3 locations:
- **Line 94**: `calculateMatchmakingStartDate()` - use `parseLocalDate()` and `formatLocalDate()`
- **Lines 233-246**: `handleCreateEvent()` - use `parseLocalDate()` for eventDate and `formatLocalDate()` for closeDate

### 3. `src/pages/CreateEvent.tsx`
Update multiple locations:
- **Line 335**: Auto-save close_date calculation
- **Lines 620-622**: Event creation close_date
- **Lines 856-862**: Matchmaking start date calculations

## Technical Details

**Before (buggy):**
```typescript
const eventDate = new Date(formData.eventDate);
closeDate.toISOString().split('T')[0]
```

**After (fixed):**
```typescript
const eventDate = parseLocalDate(formData.eventDate);
formatLocalDate(closeDate)
```

## Testing Checklist
1. Create event for Feb 28th - verify it saves as Feb 28th (not 27th)
2. Verify close_date is 3 days after event date
3. Verify matchmaking_start_date calculations work correctly:
   - "1 week before" should be exactly 7 days before event
   - "2 weeks before" should be exactly 14 days before event
4. Test from different timezones if possible
