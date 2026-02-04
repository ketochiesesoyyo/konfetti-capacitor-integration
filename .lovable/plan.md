

## CRM Enhancement: Add Clients & Select Existing Clients for Events

### Overview

This plan addresses two missing features:
1. **Add new clients directly** from the Clientes tab (without creating an event)
2. **Select existing clients** when creating a new event (for repeat Wedding Planners)

---

### Changes Required

#### 1. Clientes Tab: Add "Añadir Cliente" Button

Add a button in the Clientes tab header to create clients independently:

```text
┌──────────────────────────────────────────────────────────────┐
│  👥 Clientes                              [ + Añadir Cliente ]│
├──────────────────────────────────────────────────────────────┤
│  Stats cards...                                               │
│  Clients table...                                             │
└──────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Add a `createClient` function in Admin.tsx that inserts a new client
- Modify `ClientEditDialog` to support "create mode" (when no client is passed)
- Add a new state `isClientCreateOpen` to control the dialog

---

#### 2. AdminEventCreationDialog: Select Existing Client Option

Add a toggle/select to choose between creating a new client or using an existing one:

```text
┌────────────────────────────────────────────────────────────┐
│              Crear Evento                                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ── CLIENTE ───────────────────────────────────────────   │
│                                                            │
│  ( ) Nuevo cliente                                         │
│  (•) Seleccionar cliente existente                         │
│                                                            │
│  [ María García - La Boda Perfecta          ▼ ]            │
│                                                            │
│  ── INFORMACIÓN DEL EVENTO ────────────────────────────   │
│  ...                                                       │
└────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Add `existingClients` prop to receive the list of clients
- Add `clientMode` state: `"new"` or `"existing"`
- Add `selectedClientId` state for when using existing client
- Modify `handleCreateEvent` to:
  - Skip client creation if using existing client
  - Use `selectedClientId` for the event's `client_id`

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Admin.tsx` | Pass `clients` to `AdminEventCreationDialog`, add "Añadir Cliente" button, add `createClient` function |
| `src/components/admin/AdminEventCreationDialog.tsx` | Add client selection mode toggle, existing client dropdown |
| `src/components/admin/ClientEditDialog.tsx` | Support create mode (no client passed = new client form) |

---

### Technical Details

#### Admin.tsx Changes

```typescript
// New function to create a client directly
const createClient = async (clientData: Partial<Client>) => {
  const { error, data } = await supabase
    .from('clients')
    .insert({
      contact_name: clientData.contact_name,
      client_type: clientData.client_type || 'couple',
      company_name: clientData.company_name || null,
      email: clientData.email || null,
      phone: clientData.phone || null,
      notes: clientData.notes || null,
    })
    .select()
    .single();

  if (error) {
    toast.error("Error al crear cliente");
    return;
  }
  
  toast.success("Cliente creado");
  await loadClients();
};
```

#### AdminEventCreationDialog Props

```typescript
interface AdminEventCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: EventRequest | null;
  userId: string;
  onEventCreated: (eventId: string, inviteCode: string) => void;
  existingClients: Client[];  // NEW: pass existing clients
}
```

#### Client Selection UI

```typescript
// State
const [clientMode, setClientMode] = useState<"new" | "existing">("new");
const [selectedClientId, setSelectedClientId] = useState<string>("");

// In render
{request === null && (  // Only show when direct creation, not from lead
  <RadioGroup value={clientMode} onValueChange={setClientMode}>
    <RadioGroupItem value="new">Nuevo cliente</RadioGroupItem>
    <RadioGroupItem value="existing">Cliente existente</RadioGroupItem>
  </RadioGroup>
)}

{clientMode === "existing" && (
  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
    <SelectTrigger>
      <SelectValue placeholder="Seleccionar cliente..." />
    </SelectTrigger>
    <SelectContent>
      {existingClients.map((client) => (
        <SelectItem key={client.id} value={client.id}>
          {client.contact_name}
          {client.company_name && ` - ${client.company_name}`}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)}
```

#### Event Creation Logic Update

```typescript
// In handleCreateEvent
let clientId: string;

if (clientMode === "existing" && selectedClientId) {
  // Use existing client
  clientId = selectedClientId;
} else {
  // Create new client (existing code)
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({ ... })
    .select()
    .single();
  
  clientId = client.id;
}

// Then use clientId when creating the event
const { data: event } = await supabase.from("events").insert({
  ...
  client_id: clientId,
});
```

---

### UX Flow Summary

**Adding a new client (without event):**
1. Go to Clientes tab
2. Click "Añadir Cliente" button
3. Fill in contact details
4. Save → Client appears in table

**Creating event for repeat Wedding Planner:**
1. Click "Crear Evento"
2. Select "Cliente existente"
3. Choose from dropdown (shows contact name + company)
4. Fill event details
5. Create → Event linked to existing client

**Creating event from a lead:**
1. Go to Solicitudes tab
2. Click on lead → "Crear Evento"
3. Client form pre-filled from lead data (creates new client)
4. Create → New client + event created, linked together

