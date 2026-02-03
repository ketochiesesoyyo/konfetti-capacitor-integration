
## Apple App Store Compliance: User Blocking Feature ✅ IMPLEMENTED

### Overview
Implemented the **Block User** feature to comply with Apple's App Review Guideline 1.2 (User-Generated Content):
1. Allows users to block abusive users
2. Notifies the developer/admin of the block
3. Removes the blocked user's content from the blocker's feed instantly

---

### What Apple Requires

From the review feedback:
> "A mechanism for users to block abusive users. Blocking should also notify the developer of the inappropriate content and should remove it from the user's feed instantly."

---

### Implementation Plan

#### 1. Database: Create `blocked_users` Table

```sql
CREATE TABLE public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  event_id UUID,  -- Optional: context of where block happened
  reason TEXT,    -- Optional reason for blocking
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- Users can view their own blocks
- Users can create blocks
- Users can delete (unblock) their own blocks

#### 2. Database: Create `block_user_transaction` Function

A security definer function that atomically:
1. Inserts into `blocked_users`
2. Creates a report entry (notifies admin/developer)
3. Deletes the match between users
4. Deletes messages between users
5. Deletes swipes to prevent re-matching
6. Logs to `audit_logs`

#### 3. Update Matchmaking Profile Filtering

Modify `src/pages/Matchmaking.tsx` to exclude blocked users from the profile stack:
- Add query to fetch `blocked_users` where `blocker_id = currentUser`
- Also exclude users who have blocked the current user
- Filter these users out of the matchmaking profiles

#### 4. Update Chat/Likes Pages

Modify pages to filter out blocked users:
- `src/pages/LikedYou.tsx` - Hide blocked users from likes
- `src/pages/Chats.tsx` - Hide blocked user conversations

#### 5. Create `BlockUserDialog` Component

A new dialog component similar to `ReportDialog` that:
- Shows reason selection (optional)
- Explains what blocking does
- Calls the `block_user_transaction` function
- Redirects user back to chats after blocking

**Reasons to offer:**
- "Inappropriate behavior"
- "Harassment"
- "Made me uncomfortable"
- "Spam or fake profile"
- "Other"

#### 6. Update `ChatActionsMenu` and `ChatThread`

Add "Block User" option to the dropdown menu in:
- `src/components/ChatActionsMenu.tsx`
- `src/pages/ChatThread.tsx` header menu

**Menu structure after changes:**
```text
┌─────────────────────┐
│ 👤 View Profile     │
├─────────────────────┤
│ ❌ Unmatch          │
├─────────────────────┤
│ 🚫 Block User       │ ← NEW (red/destructive)
├─────────────────────┤
│ 🚨 Report & Unmatch │
└─────────────────────┘
```

#### 7. Add Translations

Add translation keys for both English and Spanish:
- `blockDialog.title`
- `blockDialog.description`
- `blockDialog.reasons.*`
- `blockDialog.confirm`
- `blockDialog.success`

---

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | `blocked_users` table + RLS + transaction function |
| `src/components/BlockUserDialog.tsx` | Create | New dialog for blocking |
| `src/components/ChatActionsMenu.tsx` | Modify | Add "Block User" menu item |
| `src/pages/ChatThread.tsx` | Modify | Add block dialog state + trigger |
| `src/pages/Chats.tsx` | Modify | Add block dialog + filter blocked users |
| `src/pages/Matchmaking.tsx` | Modify | Filter blocked users from stack |
| `src/pages/LikedYou.tsx` | Modify | Filter blocked users from likes |
| `src/lib/validation.ts` | Modify | Add block validation schema |
| `src/i18n/locales/en.json` | Modify | Add English translations |
| `src/i18n/locales/es.json` | Modify | Add Spanish translations |

---

### Technical Details

**Block Transaction Function (PostgreSQL):**
```sql
CREATE OR REPLACE FUNCTION public.block_user_transaction(
  _blocker_id UUID,
  _blocked_id UUID,
  _event_id UUID,
  _match_id UUID,
  _reason TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert block record
  INSERT INTO blocked_users (blocker_id, blocked_id, event_id, reason)
  VALUES (_blocker_id, _blocked_id, _event_id, _reason)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
  
  -- Create report for admin visibility
  INSERT INTO reports (reporter_id, reported_user_id, event_id, match_id, reason)
  VALUES (_blocker_id, _blocked_id, _event_id, _match_id, 'User blocked: ' || COALESCE(_reason, 'No reason provided'))
  ON CONFLICT DO NOTHING;
  
  -- Log to audit
  INSERT INTO audit_logs (action_type, actor_id, target_id, event_id, match_id, reason)
  VALUES ('block', _blocker_id, _blocked_id, _event_id, _match_id, _reason);
  
  -- Delete messages if match exists
  IF _match_id IS NOT NULL THEN
    DELETE FROM messages WHERE match_id = _match_id;
  END IF;
  
  -- Delete swipes between users
  DELETE FROM swipes 
  WHERE (user_id = _blocker_id AND swiped_user_id = _blocked_id)
     OR (user_id = _blocked_id AND swiped_user_id = _blocker_id);
  
  -- Delete match if exists
  IF _match_id IS NOT NULL THEN
    DELETE FROM matches WHERE id = _match_id;
  END IF;
END;
$$;
```

**Filtering in Matchmaking:**
```typescript
// Fetch blocked users
const { data: blockedData } = await supabase
  .from("blocked_users")
  .select("blocked_id")
  .eq("blocker_id", userId);

// Also get users who blocked current user (bidirectional hiding)
const { data: blockedByData } = await supabase
  .from("blocked_users")
  .select("blocker_id")
  .eq("blocked_id", userId);

const blockedUserIds = new Set([
  ...(blockedData?.map(b => b.blocked_id) || []),
  ...(blockedByData?.map(b => b.blocker_id) || [])
]);

// Filter profiles
const nonBlockedProfiles = profiles.filter(p => !blockedUserIds.has(p.user_id));
```

---

### User Experience Flow

```text
User opens chat with someone behaving inappropriately
        │
        ▼
Taps ⋮ menu → selects "Block User"
        │
        ▼
Block dialog appears with reason selection (optional)
        │
        ▼
User confirms block
        │
        ▼
┌──────────────────────────────────────────┐
│ Instant effects:                         │
│ • Match deleted                          │
│ • Messages deleted                       │
│ • User hidden from matchmaking           │
│ • Report created for admin review        │
│ • User redirected to Chats page          │
└──────────────────────────────────────────┘
```

---

### Age Rating Note

For the **Guideline 2.3.6** issue, you need to update the Age Rating in App Store Connect:
- Go to App Information → Age Rating
- Set "Age Assurance" to **"None"** (since the app doesn't have parental controls or age verification beyond the 18+ signup requirement)

This is a metadata change in App Store Connect, not a code change.
