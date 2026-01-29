

## Add Contact Name Field to Event Request Form

### Overview
Add a new "contact name" field to the event request form so you always know who is writing to you, regardless of whether they are a couple or a wedding planner. This name will appear prominently in the notification email you receive.

---

### Changes Required

#### 1. Database Migration
Add a new `contact_name` column to the `event_requests` table:
- Column: `contact_name` (text, nullable for backward compatibility)
- This stores the name of the person filling out the form

#### 2. Form Validation Schema
Update `src/lib/validation.ts`:
- Add `contact_name` field to `eventRequestSchema`
- Required field with max 100 characters

#### 3. Contact Form Component  
Update `src/components/landing/ContactForm.tsx`:
- Add new form field for contact name after the submitter type selection
- Include proper label and placeholder
- Pass the new field to both the database insert and edge function call

#### 4. Translations
Update both language files with new labels:

**English** (`src/i18n/locales/en.json`):
- `"contactName": "Your Name"`
- `"contactNamePlaceholder": "e.g., Maria Garcia"`

**Spanish** (`src/i18n/locales/es.json`):
- `"contactName": "Tu Nombre"`  
- `"contactNamePlaceholder": "ej., María García"`

#### 5. Edge Function - Admin Notification
Update `supabase/functions/event-request-notification/index.ts`:
- Add `contact_name` to the `EventRequestData` interface
- Display the contact name prominently in the email you receive:
  - Add a "Submitted By" section showing the contact name
  - Update the "Reply to" button to show the contact name
  - Update the email subject to include the contact name

#### 6. Edge Function - User Confirmation Email
Update the confirmation email:
- Use the contact name in the greeting for wedding planners instead of generic "Hola,"

---

### Technical Details

**Form Field Placement:**
The new field will appear right after the submitter type radio buttons and before the partner names, since knowing who is writing is primary contact information.

**Email Template Changes:**
The admin notification email will include a new section:

```text
┌─────────────────────────────────────────┐
│ CONTACT INFORMATION                     │
│ ─────────────────────────────────────── │
│ Contact Name:    Maria Garcia           │
│ Submitter Type:  Wedding Planner        │
│ Email:           maria@example.com      │
│ Phone:           +52 55 1234 5678       │
└─────────────────────────────────────────┘
```

**Database Schema:**
```sql
ALTER TABLE event_requests 
ADD COLUMN contact_name text;
```

---

### Files to Modify
1. `src/lib/validation.ts` - Add contact_name to schema
2. `src/components/landing/ContactForm.tsx` - Add form field and pass data
3. `src/i18n/locales/en.json` - Add English translations
4. `src/i18n/locales/es.json` - Add Spanish translations  
5. `supabase/functions/event-request-notification/index.ts` - Update email template
6. Database migration for `event_requests` table

