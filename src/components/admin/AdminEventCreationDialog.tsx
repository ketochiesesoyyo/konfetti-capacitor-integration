import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, Camera, X, Loader2, User, Building2, Users } from "lucide-react";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventRequest {
  id: string;
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
  contact_name?: string | null;
}

interface ExistingContact {
  id: string;
  contact_type: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
}

interface Company {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminEventCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: EventRequest | null;
  userId: string;
  onEventCreated: (eventId: string, inviteCode: string) => void;
  existingContacts?: ExistingContact[];
  companies?: Company[];
}

const MATCHMAKING_OPTIONS = [
  { value: "immediately", label: "Inmediatamente al unirse" },
  { value: "1_week_before", label: "1 semana antes del evento" },
  { value: "2_weeks_before", label: "2 semanas antes del evento" },
  { value: "day_of_event", label: "El día del evento" },
];

const CONTACT_TYPE_OPTIONS = [
  { value: "couple", label: "Pareja" },
  { value: "wedding_planner", label: "Wedding Planner" },
];

export const AdminEventCreationDialog = ({
  open,
  onOpenChange,
  request,
  userId,
  onEventCreated,
  existingContacts = [],
  companies = [],
}: AdminEventCreationDialogProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [matchmakingOption, setMatchmakingOption] = useState<string>("1_week_before");

  // Contact mode: "new" or "existing"
  const [contactMode, setContactMode] = useState<"new" | "existing">("new");
  const [selectedContactId, setSelectedContactId] = useState<string>("");

  // Contact data for new contact creation
  const [contactData, setContactData] = useState({
    contactType: "couple" as "couple" | "wedding_planner",
    contactName: "",
    companyName: "",
    email: "",
    phone: "",
  });

  const [formData, setFormData] = useState({
    coupleName1: "",
    coupleName2: "",
    eventDate: "",
  });

  // Reset form when request changes or dialog opens
  useEffect(() => {
    if (request) {
      // Pre-fill from request - always use "new" contact mode for leads
      setContactMode("new");
      setSelectedContactId("");
      setFormData({
        coupleName1: request.partner1_name,
        coupleName2: request.partner2_name,
        eventDate: request.wedding_date,
      });
      // Use contact_name if available, otherwise fall back to first partner name for couples
      const fallbackName = request.submitter_type === 'couple' 
        ? request.partner1_name 
        : "";
      setContactData({
        contactType: request.submitter_type as "couple" | "wedding_planner",
        contactName: request.contact_name || fallbackName,
        companyName: "",
        email: request.email,
        phone: request.phone,
      });
      setEventImage(null);
      setImagePreview("");
      setMatchmakingOption("1_week_before");
    } else if (open) {
      // Reset for direct event creation
      setContactMode("new");
      setSelectedContactId("");
      setFormData({
        coupleName1: "",
        coupleName2: "",
        eventDate: "",
      });
      setContactData({
        contactType: "couple",
        contactName: "",
        companyName: "",
        email: "",
        phone: "",
      });
      setEventImage(null);
      setImagePreview("");
      setMatchmakingOption("1_week_before");
    }
  }, [request, open]);

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
    
    const eventDate = new Date(formData.eventDate);
    
    switch (matchmakingOption) {
      case "immediately":
        return null;
      case "1_week_before":
        const oneWeek = new Date(eventDate);
        oneWeek.setDate(oneWeek.getDate() - 7);
        return oneWeek.toISOString().split('T')[0];
      case "2_weeks_before":
        const twoWeeks = new Date(eventDate);
        twoWeeks.setDate(twoWeeks.getDate() - 14);
        return twoWeeks.toISOString().split('T')[0];
      case "day_of_event":
        return formData.eventDate;
      default:
        return null;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5242880) {
      toast.error("La foto debe ser menor a 5MB");
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
    // Validation
    if (contactMode === "new" && !contactData.contactName?.trim()) {
      toast.error("El nombre de contacto es requerido");
      return;
    }
    if (contactMode === "existing" && !selectedContactId) {
      toast.error("Selecciona un contacto existente");
      return;
    }
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

      // Calculate dates
      const eventDate = new Date(formData.eventDate);
      const closeDate = new Date(eventDate);
      closeDate.setDate(closeDate.getDate() + 3);
      
      const matchmakingStartDate = calculateMatchmakingStartDate();

      let contactId: string;

      if (contactMode === "existing" && selectedContactId) {
        // Use existing contact
        contactId = selectedContactId;
      } else {
        // Create new contact (and company if needed)
        let companyId: string | null = null;
        
        if (contactData.contactType === 'wedding_planner' && contactData.companyName.trim()) {
          // Check if company exists
          const existingCompany = companies.find(
            c => c.name.toLowerCase() === contactData.companyName.trim().toLowerCase()
          );
          
          if (existingCompany) {
            companyId = existingCompany.id;
          } else {
            // Create new company
            const { data: newCompany, error: companyError } = await supabase
              .from("companies")
              .insert({ name: contactData.companyName.trim() })
              .select()
              .single();

            if (companyError) {
              throw new Error(`Error al crear empresa: ${companyError.message}`);
            }
            companyId = newCompany.id;
          }
        }

        const { data: contact, error: contactError } = await supabase
          .from("contacts")
          .insert({
            contact_type: contactData.contactType,
            contact_name: contactData.contactName.trim(),
            company_id: companyId,
            email: contactData.email.trim() || null,
            phone: contactData.phone.trim() || null,
            source_request_id: request?.id || null,
          })
          .select()
          .single();

        if (contactError) {
          throw new Error(`Error al crear contacto: ${contactError.message}`);
        }
        
        contactId = contact.id;
      }

      // Create event with contact_id
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          name: eventName,
          date: formData.eventDate,
          close_date: closeDate.toISOString().split('T')[0],
          description: `Wedding celebration for ${eventName}`,
          invite_code: inviteCode,
          created_by: userId,
          contact_id: contactId,
          image_url: imageUrl,
          status: 'active',
          matchmaking_start_date: matchmakingStartDate,
          matchmaking_start_time: '00:00',
        })
        .select()
        .single();

      if (eventError) {
        throw new Error(`Error al crear evento: ${eventError.message}`);
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

      onEventCreated(event.id, inviteCode);
      
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(error.message || "Error al crear el evento");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Evento desde Solicitud</DialogTitle>
            <DialogDescription>
              Completa los detalles del evento para {request?.partner1_name} & {request?.partner2_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Contact Selection Section - only show toggle when not from a request */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="w-4 h-4" />
                Contacto
              </div>

              {/* Contact Mode Toggle - only show when NOT from a request and there are existing contacts */}
              {!request && existingContacts.length > 0 && (
                <RadioGroup
                  value={contactMode}
                  onValueChange={(value: "new" | "existing") => setContactMode(value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="contact-new" />
                    <Label htmlFor="contact-new" className="cursor-pointer">Nuevo contacto</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="contact-existing" />
                    <Label htmlFor="contact-existing" className="cursor-pointer">Contacto existente</Label>
                  </div>
                </RadioGroup>
              )}

              {/* Existing Contact Dropdown */}
              {contactMode === "existing" && existingContacts.length > 0 && (
                <div className="space-y-2">
                  <Label>Seleccionar Contacto</Label>
                  <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar contacto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {existingContacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{contact.contact_name}</span>
                            {contact.company_name && (
                              <span className="text-muted-foreground">- {contact.company_name}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* New Contact Form - show when contactMode is "new" */}
              {contactMode === "new" && (
                <>
                  {/* Contact Type */}
                  <div className="space-y-2">
                    <Label>Tipo de Contacto</Label>
                    <Select 
                      value={contactData.contactType} 
                      onValueChange={(value: "couple" | "wedding_planner") => 
                        setContactData(prev => ({ ...prev, contactType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Contact Name */}
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Nombre de Contacto *</Label>
                    <Input
                      id="contactName"
                      value={contactData.contactName}
                      onChange={(e) => setContactData(prev => ({ ...prev, contactName: e.target.value }))}
                      placeholder="Nombre del contacto principal"
                    />
                  </div>

                  {/* Company Name (only for wedding planners) */}
                  {contactData.contactType === 'wedding_planner' && (
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Empresa
                      </Label>
                      <Input
                        id="companyName"
                        value={contactData.companyName}
                        onChange={(e) => setContactData(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Nombre de la empresa"
                        list="company-suggestions"
                      />
                      {companies.length > 0 && (
                        <datalist id="company-suggestions">
                          {companies.map((company) => (
                            <option key={company.id} value={company.name} />
                          ))}
                        </datalist>
                      )}
                    </div>
                  )}

                  {/* Contact Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={contactData.email}
                        onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Teléfono</Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={contactData.phone}
                        onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+34 600 000 000"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Event Information Section */}
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pt-2">
              <Calendar className="w-4 h-4" />
              Información del Evento
            </div>

            {/* Couple Names */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupleName1">Nombre 1 *</Label>
                <Input
                  id="coupleName1"
                  value={formData.coupleName1}
                  onChange={(e) => setFormData(prev => ({ ...prev, coupleName1: e.target.value }))}
                  placeholder="Nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupleName2">Nombre 2 *</Label>
                <Input
                  id="coupleName2"
                  value={formData.coupleName2}
                  onChange={(e) => setFormData(prev => ({ ...prev, coupleName2: e.target.value }))}
                  placeholder="Nombre"
                />
              </div>
            </div>

            {/* Event Date */}
            <div className="space-y-2">
              <Label htmlFor="eventDate">Fecha del Evento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Expected Guests (read-only info) */}
            {request && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Invitados solteros esperados: <span className="font-medium text-foreground">{request.expected_guests}</span>
                </p>
              </div>
            )}

            {/* Matchmaking Schedule */}
            <div className="space-y-2">
              <Label>Inicio del Matchmaking</Label>
              <Select value={matchmakingOption} onValueChange={setMatchmakingOption}>
                <SelectTrigger>
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

            {/* Event Image */}
            <div className="space-y-2">
              <Label>Imagen del Evento *</Label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemovePhoto}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Subir imagen</span>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
              Cancelar
            </Button>
            <Button onClick={handleCreateEvent} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
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
