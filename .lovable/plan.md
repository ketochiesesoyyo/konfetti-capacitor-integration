

## Enhanced Admin Panel: Client Management with Actions Menu and Detail View

### What You Need

1. **"..." Actions Menu** on each client row to:
   - Edit client details (name, email, phone, company, notes)
   - Delete client (with confirmation)

2. **Client Detail Dialog** when clicking on client name showing:
   - Client type badge (Pareja / Wedding Planner)
   - Contact name and company
   - Email and phone (clickable)
   - Event count and history (interactive table)
   - Notes section
   - Edit button

---

### Implementation Plan

#### 1. Create `ClientEditDialog` Component

A dialog for editing client information with form fields:
- Contact Name (required)
- Client Type (couple / wedding_planner)
- Company Name (for wedding planners)
- Email
- Phone
- Notes (textarea)

#### 2. Create `ClientDetailDialog` Component

A comprehensive view dialog showing:

```text
┌──────────────────────────────────────────────────────────────┐
│                    María García                              │
│                    La Boda Perfecta                          │
│            [ Wedding Planner ]                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📧 maria@labodaperfecta.com     📞 +34 612 345 678         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  EVENTOS (3)                                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Ana & Carlos        │ 15 Mar 2026 │ Activo  │ Ver →   │  │
│  │ Laura & Pedro       │ 22 Apr 2026 │ Activo  │ Ver →   │  │
│  │ Sofia & Juan        │ 10 Jun 2025 │ Cerrado │ Ver →   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  NOTAS                                                       │
│  Cliente muy organizado, prefiere comunicación por email.   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Cliente desde: 15 Ene 2026                                 │
│                                                              │
│               [ Editar ]  [ Cerrar ]                         │
└──────────────────────────────────────────────────────────────┘
```

#### 3. Add Actions Menu to Clients Table

Add a "..." dropdown menu with MoreHorizontal icon:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Cliente          │ Tipo     │ Contacto      │ Eventos │ Añadido │ Acciones │
├─────────────────────────────────────────────────────────────────────────────┤
│ María García     │ Planner  │ maria@...     │ 3       │ 15/01   │   ⋯      │
│ La Boda Perfecta │          │ +34 612...    │         │         │ ┌──────┐ │
│                  │          │               │         │         │ │ Editar │
│                  │          │               │         │         │ │ Borrar │
│                  │          │               │         │         │ └──────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4. Make Client Name Clickable

Clicking on the client name (María García) opens the ClientDetailDialog.

---

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/admin/ClientEditDialog.tsx` | Create | Dialog for editing client info |
| `src/components/admin/ClientDetailDialog.tsx` | Create | Full client card view with events table |
| `src/pages/Admin.tsx` | Modify | Add actions menu, click handlers, dialog states |

---

### Technical Details

**State Management in Admin.tsx:**
```typescript
// New state for client dialogs
const [selectedClient, setSelectedClient] = useState<Client | null>(null);
const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);
const [isClientEditOpen, setIsClientEditOpen] = useState(false);
const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
```

**Update Client Function:**
```typescript
const updateClient = async (clientId: string, updates: Partial<Client>) => {
  const { error } = await supabase
    .from('clients')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', clientId);
  
  if (error) {
    toast.error("Error al actualizar cliente");
  } else {
    toast.success("Cliente actualizado");
    await loadClients();
  }
};
```

**Delete Client Function:**
```typescript
const deleteClient = async (clientId: string) => {
  // Check if client has events first
  const client = clients.find(c => c.id === clientId);
  if (client?.events && client.events.length > 0) {
    toast.error("No puedes eliminar un cliente con eventos asociados");
    return;
  }
  
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);
  
  if (error) {
    toast.error("Error al eliminar cliente");
  } else {
    toast.success("Cliente eliminado");
    await loadClients();
  }
};
```

---

### ClientDetailDialog Layout

The dialog will include:

1. **Header Section**
   - Large contact name
   - Company name (if wedding planner)
   - Type badge
   
2. **Contact Section**
   - Email with mailto link
   - Phone with tel link
   
3. **Events Section**
   - Table showing all associated events
   - Event name, date, status
   - "Ver" button linking to EventDashboard
   - Shows count: "EVENTOS (3)"
   
4. **Notes Section**
   - Display client notes
   - Visible only if notes exist
   
5. **Footer**
   - "Cliente desde" date
   - Edit button
   - Close button

---

### ClientEditDialog Form

Form fields with validation:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Contact Name | Input | Yes | |
| Client Type | Select | Yes | couple / wedding_planner |
| Company Name | Input | No | Only visible when type = wedding_planner |
| Email | Input | No | Email validation |
| Phone | Input | No | |
| Notes | Textarea | No | Internal notes |

---

### UX Improvements

1. **Row Click Behavior**: 
   - Clicking anywhere on the row (except actions column) opens the detail dialog
   
2. **Actions Menu**:
   - Uses DropdownMenu with MoreHorizontal icon
   - "Editar" opens edit dialog
   - "Eliminar" shows confirmation alert (disabled if client has events)

3. **Edit Flow**:
   - Can edit from both the actions menu and the detail dialog
   - After saving, both dialogs close and list refreshes

4. **Visual Feedback**:
   - Loading states during save/delete
   - Success/error toasts
   - Cursor pointer on clickable areas

