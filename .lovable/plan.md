

## Simplify Likes Page: Show Only "My Likes" (People You've Liked)

### Overview
Transform the Likes page from showing "People who liked you" to showing "People you've liked" with an Unlike button to retract likes. People who liked you will continue to appear in the matchmaking stack as they do today.

---

### Current vs New Behavior

| Aspect | Current | New |
|--------|---------|-----|
| **Shows** | People who liked you | People you liked |
| **Purpose** | Respond to incoming likes | View/manage your outgoing likes |
| **Buttons** | Like ❤️ / Pass ✕ | Unlike ✕ (retract) or Go Chat (if matched) |
| **Incoming likes** | Appear here first | Appear in matchmaking stack only |

---

### User Flow After Changes

```text
You like someone in matchmaking
        │
        ▼
They appear in YOUR "Likes" tab
        │
        ├── They like you back ──► MATCH!
        │                              │
        │                              └──► "Go Chat" button appears
        │                                   (they move to Chats too)
        │
        └── You tap ✕ (Unlike) ──► Retract your like
                                   They are removed from list
                                   You can see them again in matchmaking
```

---

### Changes Required

#### 1. Simplify State Management
The page currently maintains three lists (`newLikes`, `passedLikes`, `allLikes`). We'll simplify to just one list: `myLikes` (people you've liked).

**Remove:**
- `newLikes` state
- `passedLikes` state  
- `activeTab` state (no longer needed)

**Keep:**
- `allLikes` → rename to `myLikes` for clarity

#### 2. Remove Incoming Likes Fetching
Remove the logic that fetches people who liked the current user (lines 49-165). The page will only fetch outgoing swipes.

#### 3. Remove Unused Handler Functions
Remove functions that are no longer needed:
- `handleLike()` - no longer liking back from this page
- `handlePass()` - no longer passing from this page

Keep:
- `handleUnlike()` - for retracting likes

#### 4. Simplify ProfileCard Component
Update the `ProfileCard` to only show:
- If matched: "Go Chat" button (navigates to chat)
- If not matched: "Unlike" button (retracts the like)

Remove the `showActions` and `isPassed` props since they're no longer used.

#### 5. Update Empty State Messages
Change the empty state to reflect the new purpose:
- "You haven't liked anyone yet"
- "Start swiping in matchmaking to see profiles here"

(These are already in the code, just need to use translation keys)

#### 6. Update Translations
The translations are already correct for this new behavior:
- `title`: "Your Likes" / "Tus Me Gusta" ✓
- `subtitle`: "People you've shown interest in" / "Personas en las que has mostrado interés" ✓
- `noLikesDesc`: "Start swiping to show interest!" ✓

---

### Technical Details

**Data Flow:**
```text
Query: SELECT from swipes 
       WHERE user_id = current_user 
       AND direction = 'right'
       
Then: Check if each liked user has matched back
      by querying the matches table
      
Display: Profile cards with appropriate button
         - Matched → "Go Chat" 
         - Not matched → "Unlike"
```

**Files to Modify:**
1. `src/pages/LikedYou.tsx` - Main logic changes
   - Remove incoming likes fetching (lines 49-165)
   - Remove `newLikes`, `passedLikes`, `activeTab` state
   - Rename `allLikes` to `myLikes`
   - Remove `handleLike()` and `handlePass()` functions
   - Simplify `ProfileCard` props
   - Remove commented-out tab selector
   - Update empty state to use translation keys

---

### What Stays the Same
- The overall page layout and design
- The ProfileViewDialog for viewing full profiles
- The "Go Chat" button when matched
- The Unlike functionality
- All existing translation keys (they already match the new behavior)

