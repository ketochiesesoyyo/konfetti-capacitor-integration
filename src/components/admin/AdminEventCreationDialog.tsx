import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, Camera, X, Loader2, Building2, Plus, DollarSign, Percent, Users } from "lucide-react";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatLocalDate, parseLocalDate } from "@/lib/utils";

interface EventRequest {
  id: string;
  contact_name: string | null;
  company_name: string | null;
  partner1_name: string;
  partner2_name: string;
  wedding_date: string;
  expected_guests: number;
  email: string;
  phone: string;
  message: string | null;
  submitter_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  contact_name: string;
  contact_type: string;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  companies: { name: string } | null;
}

interface AdminEventCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: EventRequest | null;
  userId: string | null;
  onEventCreated: (eventId: string, inviteCode: string, contactId?: string) => void;
}

const MATCHMAKING_OPTIONS = [
  { value: "immediately", label: "Inmediatamente al unirse" },
  { value: "1_week_before", label: "1 semana antes del evento" },
  { value: "2_weeks_before", label: "2 semanas antes del evento" },
  { value: "day_of_event", label: "El día del evento" },
];

const CURRENCY_OPTIONS = [
  { value: "MXN", label: "MXN (Peso Mexicano)", symbol: "$" },
  { value: "USD", label: "USD (Dólar)", symbol: "$" },
  { value: "INR", label: "INR (Rupia India)", symbol: "₹" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "partial", label: "Parcial" },
  { value: "paid", label: "Pagado" },
];

export const AdminEventCreationDialog = ({
  open,
  onOpenChange,
  request,
  userId,
  onEventCreated,
}: AdminEventCreationDialogProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [matchmakingOption, setMatchmakingOption] = useState<string>("1_week_before");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false);
  const [clientMode, setClientMode] = useState<"existing" | "new">("new");

  const [formData, setFormData] = useState({
    coupleName1: "",
    coupleName2: "",
    eventDate: "",
    // Client selection
    selectedClientId: "",
    // Client info (for new client creation)
    clientName: "",
    clientType: "couple" as "couple" | "wedding_planner",
    clientEmail: "",
    clientPhone: "",
    companyId: "",
    newCompanyName: "",
    // Financial info
    price: "",
    currency: "MXN",
    commissionType: "" as "" | "percentage" | "fixed",
    commissionValue: "",
    paymentStatus: "pending",
  });

  // Load companies and contacts on mount
  useEffect(() => {
    const loadData = async () => {
      // Load companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      if (companiesData) {
        setCompanies(companiesData);
      }

      // Load contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, contact_name, contact_type, email, phone, company_id, companies(name)')
        .eq('status', 'active')
        .order('contact_name');
      if (contactsData) {
        setContacts(contactsData as Contact[]);
      }
    };
    if (open) {
      loadData();
    }
  }, [open]);

  // Reset form when request changes
  useEffect(() => {
    if (request) {
      // Find company if exists
      const matchingCompany = companies.find(
        c => c.name.toLowerCase() === request.company_name?.toLowerCase()
      );

      setFormData({
        coupleName1: request.partner1_name,
        coupleName2: request.partner2_name,
        eventDate: request.wedding_date,
        selectedClientId: "",
        clientName: request.contact_name || "",
        clientType: request.submitter_type as "couple" | "wedding_planner",
        clientEmail: request.email,
        clientPhone: request.phone,
        companyId: matchingCompany?.id || "",
        newCompanyName: matchingCompany ? "" : (request.company_name || ""),
        // Financial defaults
        price: "",
        currency: "MXN",
        commissionType: request.submitter_type === "wedding_planner" ? "percentage" : "",
        commissionValue: "",
        paymentStatus: "pending",
      });
      setClientMode("new");
      setShowNewCompanyInput(!matchingCompany && !!request.company_name);
      setEventImage(null);
      setImagePreview("");
      setMatchmakingOption("1_week_before");
    } else {
      // Reset form for new event without request
      setFormData({
        coupleName1: "",
        coupleName2: "",
        eventDate: "",
        selectedClientId: "",
        clientName: "",
        clientType: "couple",
        clientEmail: "",
        clientPhone: "",
        companyId: "",
        newCompanyName: "",
        // Financial defaults
        price: "",
        currency: "MXN",
        commissionType: "",
        commissionValue: "",
        paymentStatus: "pending",
      });
      setClientMode(contacts.length > 0 ? "existing" : "new");
      setShowNewCompanyInput(false);
      setEventImage(null);
      setImagePreview("");
      setMatchmakingOption("1_week_before");
    }
  }, [request, open, companies]);

  const generateInviteCode = () => {
    const name1 = formData.coupleName1.toUpperCase().replace(/\s+/g, '');
    const name2 = formData.coupleName2.toUpperCase().replace(/\s+/g, '');
    const year = new Date(formData.eventDate).getFullYear();

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomChars = '';
    for (let i = 0; i < 4; i++) {
      randomChars += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `${name1.substring(0, 3)}${name2.substring(0, 3)}${year}${randomChars}`;
  };

  const calculateMatchmakingStartDate = () => {
    if (!formData.eventDate) return null;

    const eventDate = parseLocalDate(formData.eventDate);

    switch (matchmakingOption) {
      case "immediately":
        return null;
      case "1_week_before":
        const oneWeek = new Date(eventDate);
        oneWeek.setDate(oneWeek.getDate() - 7);
        return formatLocalDate(oneWeek);
      case "2_weeks_before":
        const twoWeeks = new Date(eventDate);
        twoWeeks.setDate(twoWeeks.getDate() - 14);
        return formatLocalDate(twoWeeks);
      case "day_of_event":
        return formData.eventDate;
      default:
        return null;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10485760) {
      toast.error("La foto debe ser menor a 10MB");
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error("Por favor sube una imagen JPG, PNG o WEBP");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setTempImageUrl(imageUrl);
    setTempImageFile(file);
    setCropDialogOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      if (!tempImageFile) {
        throw new Error("No hay archivo de imagen seleccionado");
      }

      if (!croppedBlob || croppedBlob.size === 0) {
        throw new Error("Imagen recortada inválida");
      }

      setCropDialogOpen(false);

      const mimeType = croppedBlob.type || 'image/jpeg';
      const fileExtension = mimeType.split('/')[1] || 'jpg';
      const fileName = `event_${Date.now()}.${fileExtension}`;

      const file = new File([croppedBlob], fileName, { type: mimeType });
      setEventImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImagePreview(reader.result as string);
          toast.success("Foto lista!");
        }
      };
      reader.readAsDataURL(file);

      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl("");
      setTempImageFile(null);

    } catch (error: any) {
      toast.error("Error al procesar la imagen");
      setCropDialogOpen(false);
      if (tempImageUrl) {
        URL.revokeObjectURL(tempImageUrl);
      }
      setTempImageUrl("");
      setTempImageFile(null);
    }
  };

  const handleRemovePhoto = () => {
    setEventImage(null);
    setImagePreview("");
  };

  const handleCreateEvent = async () => {
    if (!userId) {
      toast.error("Error de autenticación");
      return;
    }

    // Validation
    if (!formData.coupleName1?.trim()) {
      toast.error("El nombre del primer integrante es requerido");
      return;
    }
    if (!formData.coupleName2?.trim()) {
      toast.error("El nombre del segundo integrante es requerido");
      return;
    }
    if (!formData.eventDate) {
      toast.error("La fecha del evento es requerida");
      return;
    }
    if (!eventImage && !imagePreview) {
      toast.error("La imagen del evento es requerida");
      return;
    }

    setIsCreating(true);

    try {
      const inviteCode = generateInviteCode();
      const eventName = `${formData.coupleName1.trim()} & ${formData.coupleName2.trim()}`;

      let imageUrl = imagePreview;

      // Upload image
      if (eventImage) {
        const fileExt = eventImage.name.split('.').pop() || 'jpg';
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(fileName, eventImage, {
            cacheControl: '3600',
            upsert: false,
            contentType: eventImage.type || 'image/jpeg'
          });

        if (uploadError) {
          throw new Error(`Error al subir imagen: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('event-photos')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Calculate dates using local timezone helpers
      const eventDate = parseLocalDate(formData.eventDate);
      const closeDate = new Date(eventDate);
      closeDate.setDate(closeDate.getDate() + 3);

      const matchmakingStartDate = calculateMatchmakingStartDate();

      let contactId: string | undefined;
      let companyId: string | null = null;

      // Check if using existing client (for manual event creation only)
      if (!request && clientMode === "existing" && formData.selectedClientId) {
        // Use selected existing client
        contactId = formData.selectedClientId;
      } else {
        // Determine client info source (from request or new client form)
        const clientName = request
          ? (request.contact_name?.trim() || eventName)
          : (formData.clientName?.trim() || eventName);
        const clientType = request ? request.submitter_type : formData.clientType;
        const clientEmail = request ? request.email : formData.clientEmail;
        const clientPhone = request ? request.phone : formData.clientPhone;

        // Handle company creation/selection for wedding planners
        if (clientType === 'wedding_planner') {
          if (formData.companyId) {
            companyId = formData.companyId;
          } else if (formData.newCompanyName?.trim()) {
            // Create new company
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({ name: formData.newCompanyName.trim() })
              .select()
              .single();

            if (companyError) {
              console.error("Error creating company:", companyError);
            } else if (newCompany) {
              companyId = newCompany.id;
            }
          }
        }

        // Create or find contact
        if (clientEmail) {
          // Check if contact already exists with this email
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', clientEmail)
            .single();

          if (existingContact) {
            contactId = existingContact.id;

            // Update company link if needed
            if (companyId) {
              await supabase
                .from('contacts')
                .update({ company_id: companyId })
                .eq('id', existingContact.id);
            }
          } else {
            // Create new contact
            const { data: newContact, error: contactError } = await supabase
              .from('contacts')
              .insert({
                contact_name: clientName,
                contact_type: clientType,
                email: clientEmail || null,
                phone: clientPhone || null,
                company_id: companyId,
                source_request_id: request?.id || null,
                status: 'active',
              })
              .select()
              .single();

            if (contactError) {
              console.error("Error creating contact:", contactError);
            } else if (newContact) {
              contactId = newContact.id;
            }
          }
        }
      }

      // Create event (without financial fields first for backward compatibility)
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          name: eventName,
          date: formData.eventDate,
          close_date: formatLocalDate(closeDate),
          description: `Wedding celebration for ${eventName}`,
          invite_code: inviteCode,
          created_by: userId,
          image_url: imageUrl,
          status: 'active',
          matchmaking_start_date: matchmakingStartDate,
          matchmaking_start_time: '00:00',
          contact_id: contactId || null,
        })
        .select()
        .single();

      if (eventError) {
        throw new Error(`Error al crear evento: ${eventError.message}`);
      }

      // Try to update with financial fields (ignore error if columns don't exist)
      const priceValue = formData.price ? parseFloat(formData.price) : null;
      const commissionValue = formData.commissionValue ? parseFloat(formData.commissionValue) : null;

      if (priceValue || formData.commissionType) {
        try {
          await supabase
            .from("events")
            .update({
              price: priceValue,
              currency: formData.currency,
              commission_type: formData.commissionType || null,
              commission_value: commissionValue,
              payment_status: formData.paymentStatus,
            })
            .eq('id', event.id);
        } catch (financialError) {
          // Financial columns might not exist yet - that's ok
          console.warn("Could not save financial data - migration may not be applied:", financialError);
        }
      }

      // Auto-join creator to event
      await supabase
        .from("event_attendees")
        .insert({
          event_id: event.id,
          user_id: userId,
        });

      // Update the request with event_id and status
      if (request) {
        await supabase
          .from('event_requests')
          .update({
            status: 'paid',
            event_id: event.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id);
      }

      onEventCreated(event.id, inviteCode, contactId);

    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(error.message || "Error al crear el evento");
    } finally {
      setIsCreating(false);
    }
  };

  const isManualCreation = !request;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {request ? "Crear Evento desde Solicitud" : "Crear Nuevo Evento"}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {request
                    ? `Completa los detalles del evento para ${request.partner1_name} & ${request.partner2_name}`
                    : "Completa los detalles para crear un nuevo evento"
                  }
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Section: Event Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">1</span>
                Detalles del Evento
              </h3>

              {/* Couple Names */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
                <div className="space-y-2">
                  <Label htmlFor="coupleName1" className="text-sm font-medium">Nombre Pareja 1 *</Label>
                  <Input
                    id="coupleName1"
                    value={formData.coupleName1}
                    onChange={(e) => setFormData(prev => ({ ...prev, coupleName1: e.target.value }))}
                    placeholder="ej., María"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupleName2" className="text-sm font-medium">Nombre Pareja 2 *</Label>
                  <Input
                    id="coupleName2"
                    value={formData.coupleName2}
                    onChange={(e) => setFormData(prev => ({ ...prev, coupleName2: e.target.value }))}
                    placeholder="ej., Juan"
                    className="h-11"
                  />
                </div>
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <Label htmlFor="eventDate" className="text-sm font-medium">Fecha del Evento *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              {/* Expected Guests (read-only info from request) */}
              {request && (
                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Invitados solteros esperados</p>
                    <p className="font-semibold text-lg">{request.expected_guests} personas</p>
                  </div>
                </div>
              )}
            </div>

            {/* Section: Client Info - For manual creation */}
            {isManualCreation && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">2</span>
                  Información del Cliente
                </h3>

                <div className="p-4 bg-muted/30 rounded-xl space-y-4">
                  {/* Client Mode Toggle */}
                  {contacts.length > 0 && (
                    <div className="flex items-center justify-between pb-3 border-b">
                      <span className="text-sm font-medium">Tipo de cliente</span>
                      <div className="flex bg-muted rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setClientMode("existing");
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            clientMode === "existing"
                              ? "bg-background shadow text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Existente
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setClientMode("new");
                            setFormData(prev => ({ ...prev, selectedClientId: "" }));
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            clientMode === "new"
                              ? "bg-background shadow text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Nuevo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Select Existing Client */}
                  {clientMode === "existing" && contacts.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Seleccionar Cliente</Label>
                      <Select
                        value={formData.selectedClientId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, selectedClientId: value }))}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Seleccionar cliente existente" />
                        </SelectTrigger>
                        <SelectContent>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.contact_name}
                              {contact.companies?.name && (
                                <span className="text-muted-foreground ml-1">
                                  ({contact.companies.name})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.selectedClientId && (
                        <div className="p-3 bg-background rounded-lg border">
                          {(() => {
                            const selected = contacts.find(c => c.id === formData.selectedClientId);
                            if (!selected) return null;
                            return (
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {selected.email && (
                                  <div>
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="ml-1 font-medium">{selected.email}</span>
                                  </div>
                                )}
                                {selected.phone && (
                                  <div>
                                    <span className="text-muted-foreground">Tel:</span>
                                    <span className="ml-1 font-medium">{selected.phone}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-muted-foreground">Tipo:</span>
                                  <span className="ml-1 font-medium">{selected.contact_type === 'wedding_planner' ? 'Wedding Planner' : 'Pareja'}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Create New Client Form */}
                  {clientMode === "new" && (
                    <div className="space-y-4">
                      {/* Client Type */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tipo de Cliente</Label>
                        <RadioGroup
                          value={formData.clientType}
                          onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            clientType: value as "couple" | "wedding_planner",
                            companyId: value === "couple" ? "" : prev.companyId,
                            newCompanyName: value === "couple" ? "" : prev.newCompanyName,
                          }))}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="couple" id="type-couple" />
                            <label htmlFor="type-couple" className="text-sm cursor-pointer">Pareja</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="wedding_planner" id="type-planner" />
                            <label htmlFor="type-planner" className="text-sm cursor-pointer">Wedding Planner</label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Client Name */}
                      <div className="space-y-2">
                        <Label htmlFor="clientName" className="text-sm font-medium">Nombre del Contacto</Label>
                        <Input
                          id="clientName"
                          value={formData.clientName}
                          onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                          placeholder="ej., Ana García"
                          className="h-11"
                        />
                      </div>

                      {/* Client Email & Phone */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="clientEmail" className="text-sm font-medium">Email</Label>
                          <Input
                            id="clientEmail"
                            type="email"
                            value={formData.clientEmail}
                            onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                            placeholder="email@ejemplo.com"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientPhone" className="text-sm font-medium">Teléfono</Label>
                          <Input
                            id="clientPhone"
                            type="tel"
                            value={formData.clientPhone}
                            onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                            placeholder="+52 55 1234 5678"
                            className="h-11"
                          />
                        </div>
                      </div>

                      {/* Company - Only for wedding planners */}
                      {formData.clientType === "wedding_planner" && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Empresa</Label>
                          {!showNewCompanyInput ? (
                            <div className="flex gap-2">
                              <Select
                                value={formData.companyId}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}
                              >
                                <SelectTrigger className="flex-1 h-11">
                                  <SelectValue placeholder="Seleccionar empresa" />
                                </SelectTrigger>
                                <SelectContent>
                                  {companies.map((company) => (
                                    <SelectItem key={company.id} value={company.id}>
                                      {company.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-11 w-11"
                                onClick={() => {
                                  setShowNewCompanyInput(true);
                                  setFormData(prev => ({ ...prev, companyId: "" }));
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                value={formData.newCompanyName}
                                onChange={(e) => setFormData(prev => ({ ...prev, newCompanyName: e.target.value }))}
                                placeholder="Nombre de la nueva empresa"
                                className="flex-1 h-11"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setShowNewCompanyInput(false);
                                  setFormData(prev => ({ ...prev, newCompanyName: "" }));
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Company info from request - for wedding planners */}
            {request && request.submitter_type === "wedding_planner" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">2</span>
                  Empresa del Wedding Planner
                </h3>

                <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                  {!showNewCompanyInput ? (
                    <div className="flex gap-2">
                      <Select
                        value={formData.companyId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}
                      >
                        <SelectTrigger className="flex-1 h-11">
                          <SelectValue placeholder="Seleccionar empresa existente" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => {
                          setShowNewCompanyInput(true);
                          setFormData(prev => ({ ...prev, companyId: "" }));
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={formData.newCompanyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, newCompanyName: e.target.value }))}
                        placeholder={request.company_name || "Nombre de la empresa"}
                        className="flex-1 h-11"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowNewCompanyInput(false);
                          setFormData(prev => ({ ...prev, newCompanyName: "" }));
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                  {request.company_name && !formData.companyId && !formData.newCompanyName && (
                    <p className="text-sm text-muted-foreground bg-background p-2 rounded-lg">
                      Empresa del formulario: <span className="font-medium text-foreground">{request.company_name}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Section: Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">{isManualCreation ? "3" : request?.submitter_type === "wedding_planner" ? "3" : "2"}</span>
                Configuración
              </h3>

              {/* Matchmaking Schedule */}
              <div className="p-4 bg-muted/30 rounded-xl space-y-2">
                <Label className="text-sm font-medium">Inicio del Matchmaking</Label>
                <Select value={matchmakingOption} onValueChange={setMatchmakingOption}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleccionar opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATCHMAKING_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section: Financial Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">{isManualCreation ? "4" : request?.submitter_type === "wedding_planner" ? "4" : "3"}</span>
                Información Financiera
              </h3>

              <div className="p-4 bg-muted/30 rounded-xl space-y-4">
                {/* Price and Currency */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">Precio</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-medium">Moneda</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger id="currency" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Commission Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Comisión</Label>
                  <RadioGroup
                    value={formData.commissionType}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      commissionType: value as "" | "percentage" | "fixed",
                      commissionValue: value === "" ? "" : prev.commissionValue,
                    }))}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="" id="commission-none" />
                      <label htmlFor="commission-none" className="text-sm cursor-pointer">Sin comisión</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="commission-percentage" />
                      <label htmlFor="commission-percentage" className="text-sm cursor-pointer">Porcentaje</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="commission-fixed" />
                      <label htmlFor="commission-fixed" className="text-sm cursor-pointer">Monto fijo</label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Commission Value - Only shown if commission type is selected */}
                {formData.commissionType && (
                  <div className="space-y-2">
                    <Label htmlFor="commissionValue" className="text-sm font-medium">
                      {formData.commissionType === "percentage" ? "Porcentaje de Comisión" : "Monto de Comisión"}
                    </Label>
                    <div className="relative">
                      {formData.commissionType === "percentage" ? (
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      ) : (
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      )}
                      <Input
                        id="commissionValue"
                        type="number"
                        step={formData.commissionType === "percentage" ? "1" : "0.01"}
                        min="0"
                        max={formData.commissionType === "percentage" ? "100" : undefined}
                        value={formData.commissionValue}
                        onChange={(e) => setFormData(prev => ({ ...prev, commissionValue: e.target.value }))}
                        placeholder={formData.commissionType === "percentage" ? "15" : "1000.00"}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                )}

                {/* Payment Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estado de Pago</Label>
                  <Select
                    value={formData.paymentStatus}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section: Event Image */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">{isManualCreation ? "5" : request?.submitter_type === "wedding_planner" ? "5" : "4"}</span>
                Imagen del Evento *
              </h3>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    className="w-full h-56 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3 shadow-lg"
                    onClick={handleRemovePhoto}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Camera className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Clic para subir imagen</span>
                  <span className="text-xs text-muted-foreground/70 mt-1">JPG, PNG o WEBP hasta 5MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating} className="h-11">
              Cancelar
            </Button>
            <Button onClick={handleCreateEvent} disabled={isCreating} className="h-11 px-8">
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando evento...
                </>
              ) : (
                "Crear Evento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageCropDialog
        open={cropDialogOpen}
        imageUrl={tempImageUrl}
        onClose={() => {
          setCropDialogOpen(false);
          if (tempImageUrl) URL.revokeObjectURL(tempImageUrl);
          setTempImageUrl("");
          setTempImageFile(null);
        }}
        onCropComplete={handleCropComplete}
        type="event"
      />
    </>
  );
};
