import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Contact {
  id: string;
  contact_type: string;
  contact_name: string;
  company_id?: string | null;
  companies?: {
    id: string;
    name: string;
  } | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  source_request_id: string | null;
  events: { id: string; name: string; date: string | null }[];
}

interface Company {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onSave: (contactId: string | null, updates: Partial<Contact> & { company_name?: string }) => Promise<void>;
  mode?: "edit" | "create";
  companies?: Company[];
}

export const ClientEditDialog = ({ open, onOpenChange, contact, onSave, mode = "edit", companies = [] }: ClientEditDialogProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    contact_name: "",
    contact_type: "couple",
    company_name: "",
    email: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    if (mode === "edit" && contact) {
      setFormData({
        contact_name: contact.contact_name || "",
        contact_type: contact.contact_type || "couple",
        company_name: contact.companies?.name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        notes: contact.notes || "",
      });
    } else if (mode === "create") {
      // Reset form for create mode
      setFormData({
        contact_name: "",
        contact_type: "couple",
        company_name: "",
        email: "",
        phone: "",
        notes: "",
      });
    }
  }, [contact, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    await onSave(mode === "edit" ? contact?.id || null : null, {
      contact_name: formData.contact_name,
      contact_type: formData.contact_type,
      company_name: formData.contact_type === "wedding_planner" ? formData.company_name : undefined,
      email: formData.email || null,
      phone: formData.phone || null,
      notes: formData.notes || null,
    });
    setIsSaving(false);
    onOpenChange(false);
  };

  const isCreateMode = mode === "create";
  const existingCompanyNames = companies.map(c => c.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreateMode ? "Añadir Contacto" : "Editar Contacto"}</DialogTitle>
          <DialogDescription>
            {isCreateMode ? "Crea un nuevo contacto en el CRM" : "Actualiza la información del contacto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact_name">Nombre de contacto *</Label>
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_type">Tipo de contacto</Label>
            <Select
              value={formData.contact_type}
              onValueChange={(value) => setFormData({ ...formData, contact_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="couple">Pareja</SelectItem>
                <SelectItem value="wedding_planner">Wedding Planner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.contact_type === "wedding_planner" && (
            <div className="space-y-2">
              <Label htmlFor="company_name">Nombre de empresa</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Ej: La Boda Perfecta"
                list="company-suggestions"
              />
              {existingCompanyNames.length > 0 && (
                <datalist id="company-suggestions">
                  {existingCompanyNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="cliente@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+34 600 000 000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas sobre el cliente..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !formData.contact_name} className="flex-1">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isCreateMode ? "Crear" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
