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

interface Client {
  id: string;
  client_type: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
}

interface AdminEventCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: EventRequest | null;
  userId: string;
  onEventCreated: (eventId: string, inviteCode: string) => void;
  existingClients?: Client[];
}

const MATCHMAKING_OPTIONS = [
  { value: "immediately", label: "Inmediatamente al unirse" },
  { value: "1_week_before", label: "1 semana antes del evento" },
  { value: "2_weeks_before", label: "2 semanas antes del evento" },
  { value: "day_of_event", label: "El día del evento" },
];

const CLIENT_TYPE_OPTIONS = [
  { value: "couple", label: "Pareja" },
  { value: "wedding_planner", label: "Wedding Planner" },
];

export const AdminEventCreationDialog = ({
  open,
  onOpenChange,
  request,
  userId,
  onEventCreated,
  existingClients = [],
}: AdminEventCreationDialogProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [matchmakingOption, setMatchmakingOption] = useState<string>("1_week_before");

  // Client mode: "new" or "existing"
  const [clientMode, setClientMode] = useState<"new" | "existing">("new");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // Client data for new client creation
  const [clientData, setClientData] = useState({
    clientType: "couple" as "couple" | "wedding_planner",
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
      // Pre-fill from request - always use "new" client mode for leads
      setClientMode("new");
      setSelectedClientId("");
      setFormData({
        coupleName1: request.partner1_name,
        coupleName2: request.partner2_name,
        eventDate: request.wedding_date,
      });
      // Use contact_name if available, otherwise fall back to first partner name for couples
      const fallbackName = request.submitter_type === 'couple' 
        ? request.partner1_name 
        : "";
      setClientData({
        clientType: request.submitter_type as "couple" | "wedding_planner",
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
      setClientMode("new");
      setSelectedClientId("");
      setFormData({
        coupleName1: "",
        coupleName2: "",
        eventDate: "",
      });
      setClientData({
        clientType: "couple",
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
    if (clientMode === "new" && !clientData.contactName?.trim()) {
      toast.error("El nombre de contacto es requerido");
      return;
    }
    if (clientMode === "existing" && !selectedClientId) {
      toast.error("Selecciona un cliente existente");
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

      let clientId: string;

      if (clientMode === "existing" && selectedClientId) {
        // Use existing client
        clientId = selectedClientId;
      } else {
        // Create new client
        const { data: client, error: clientError } = await supabase
          .from("clients")
          .insert({
            client_type: clientData.clientType,
            contact_name: clientData.contactName.trim(),
            company_name: clientData.clientType === 'wedding_planner' ? clientData.companyName.trim() || null : null,
            email: clientData.email.trim() || null,
            phone: clientData.phone.trim() || null,
            source_request_id: request?.id || null,
          })
          .select()
          .single();

        if (clientError) {
          throw new Error(`Error al crear cliente: ${clientError.message}`);
        }
        
        clientId = client.id;
      }

      // Create event with client_id
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          name: eventName,
          date: formData.eventDate,
          close_date: closeDate.toISOString().split('T')[0],
          description: `Wedding celebration for ${eventName}`,
          invite_code: inviteCode,
          created_by: userId,
          client_id: clientId,
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
            {/* Client Selection Section - only show toggle when not from a request */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="w-4 h-4" />
                Cliente
              </div>

              {/* Client Mode Toggle - only show when NOT from a request and there are existing clients */}
              {!request && existingClients.length > 0 && (
                <RadioGroup
                  value={clientMode}
                  onValueChange={(value: "new" | "existing") => setClientMode(value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="client-new" />
                    <Label htmlFor="client-new" className="cursor-pointer">Nuevo cliente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="client-existing" />
                    <Label htmlFor="client-existing" className="cursor-pointer">Cliente existente</Label>
                  </div>
                </RadioGroup>
              )}

              {/* Existing Client Dropdown */}
              {clientMode === "existing" && existingClients.length > 0 && (
                <div className="space-y-2">
                  <Label>Seleccionar Cliente</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {existingClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{client.contact_name}</span>
                            {client.company_name && (
                              <span className="text-muted-foreground">- {client.company_name}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* New Client Form - show when clientMode is "new" */}
              {clientMode === "new" && (
                <>
                  {/* Client Type */}
                  <div className="space-y-2">
                    <Label>Tipo de Cliente</Label>
                    <Select 
                      value={clientData.clientType} 
                      onValueChange={(value: "couple" | "wedding_planner") => 
                        setClientData(prev => ({ ...prev, clientType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLIENT_TYPE_OPTIONS.map((option) => (
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
                      value={clientData.contactName}
                      onChange={(e) => setClientData(prev => ({ ...prev, contactName: e.target.value }))}
                      placeholder="Nombre del contacto principal"
                    />
                  </div>

                  {/* Company Name (only for wedding planners) */}
                  {clientData.clientType === 'wedding_planner' && (
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Empresa
                      </Label>
                      <Input
                        id="companyName"
                        value={clientData.companyName}
                        onChange={(e) => setClientData(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Nombre de la empresa"
                      />
                    </div>
                  )}

                  {/* Contact Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientEmail">Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={clientData.email}
                        onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientPhone">Teléfono</Label>
                      <Input
                        id="clientPhone"
                        type="tel"
                        value={clientData.phone}
                        onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
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
