import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  Users,
  Loader2,
  Plus,
  Archive,
  ImageIcon,
  Pencil,
  Send,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseLocalDate } from "@/lib/utils";
import { useAdminContext } from "@/components/admin/AdminLayout";

interface Contact {
  id: string;
  contact_name: string;
  contact_type: string;
  email: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
  company_id: string | null;
  created_at: string;
  user_id: string | null;
  invited_at: string | null;
  companies: { name: string } | null;
}

interface ClientEvent {
  id: string;
  name: string;
  date: string | null;
  status: string;
  invite_code: string;
  image_url: string | null;
  close_date: string;
  event_attendees: { count: number }[];
}

interface Company {
  id: string;
  name: string;
}

const AdminClientDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { refreshCounts } = useAdminContext();
  const [isLoading, setIsLoading] = useState(true);
  const [contact, setContact] = useState<Contact | null>(null);
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const [isInviting, setIsInviting] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false);
  const [editFormData, setEditFormData] = useState({
    contactName: "",
    contactType: "couple" as "couple" | "wedding_planner",
    email: "",
    phone: "",
    companyId: "",
    newCompanyName: "",
  });

  useEffect(() => {
    loadContact();
  }, [id]);

  const loadContact = async () => {
    if (!id) return;

    setIsLoading(true);

    // Load contact with company
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('*, companies(name)')
      .eq('id', id)
      .single();

    if (contactError || !contactData) {
      toast.error("Cliente no encontrado");
      navigate("/admin/clients");
      return;
    }

    setContact(contactData);
    setNotes(contactData.notes || "");

    // Load events for this contact
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*, event_attendees(count)')
      .eq('contact_id', id)
      .order('date', { ascending: false });

    if (!eventsError && eventsData) {
      setEvents(eventsData as ClientEvent[]);
    }

    setIsLoading(false);
  };

  const saveNotesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNotes = async (newNotes: string) => {
    if (!id) return;

    setIsSavingNotes(true);
    const { error } = await supabase
      .from('contacts')
      .update({ notes: newNotes, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error("Error al guardar notas");
    }
    setIsSavingNotes(false);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);

    // Debounce the save
    if (saveNotesTimeoutRef.current) {
      clearTimeout(saveNotesTimeoutRef.current);
    }
    saveNotesTimeoutRef.current = setTimeout(() => {
      saveNotes(newNotes);
    }, 1000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveNotesTimeoutRef.current) {
        clearTimeout(saveNotesTimeoutRef.current);
      }
    };
  }, []);

  const handleArchive = async () => {
    if (!id) return;

    setIsArchiving(true);
    const { error } = await supabase
      .from('contacts')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast.error("Error al archivar cliente");
    } else {
      toast.success("Cliente archivado");
      refreshCounts();
      navigate("/admin/clients");
    }
    setIsArchiving(false);
  };

  // Load companies for edit dialog
  const loadCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');
    if (data) {
      setCompanies(data);
    }
  };

  // Open edit dialog
  const openEditDialog = async () => {
    if (!contact) return;

    await loadCompanies();

    setEditFormData({
      contactName: contact.contact_name,
      contactType: contact.contact_type as "couple" | "wedding_planner",
      email: contact.email || "",
      phone: contact.phone || "",
      companyId: contact.company_id || "",
      newCompanyName: "",
    });
    setShowNewCompanyInput(false);
    setEditDialogOpen(true);
  };

  // Handle update client
  const handleUpdateClient = async () => {
    if (!id || !contact) return;

    if (!editFormData.contactName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setIsUpdating(true);

    try {
      let companyId: string | null = null;

      // Handle company for wedding planners
      if (editFormData.contactType === 'wedding_planner') {
        if (editFormData.companyId) {
          companyId = editFormData.companyId;
        } else if (editFormData.newCompanyName?.trim()) {
          // Create new company
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({ name: editFormData.newCompanyName.trim() })
            .select()
            .single();

          if (companyError) {
            throw new Error("Error al crear empresa");
          }
          companyId = newCompany.id;
        }
      }

      // Check for duplicate email (if email changed)
      if (editFormData.email && editFormData.email !== contact.email) {
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('email', editFormData.email)
          .neq('id', id)
          .single();

        if (existingContact) {
          toast.error("Ya existe un cliente con este email");
          setIsUpdating(false);
          return;
        }
      }

      // Update the contact
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          contact_name: editFormData.contactName.trim(),
          contact_type: editFormData.contactType,
          email: editFormData.email || null,
          phone: editFormData.phone || null,
          company_id: companyId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        throw new Error("Error al actualizar cliente");
      }

      toast.success("Cliente actualizado exitosamente");
      setEditDialogOpen(false);

      // Reload contact data
      await loadContact();
      refreshCounts();

    } catch (error: any) {
      console.error("Error updating client:", error);
      toast.error(error.message || "Error al actualizar cliente");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInviteToPortal = async () => {
    if (!id || !contact?.email) return;

    setIsInviting(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          invited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Copy invite link to clipboard
      const inviteUrl = `${window.location.origin}/portal/register?email=${encodeURIComponent(contact.email)}`;
      await navigator.clipboard.writeText(inviteUrl);

      toast.success("Invitación registrada. El enlace se ha copiado al portapapeles.");
      await loadContact();
    } catch (error: any) {
      console.error("Error inviting client:", error);
      toast.error("Error al invitar al cliente");
    } finally {
      setIsInviting(false);
    }
  };

  const getPortalStatus = (): 'none' | 'invited' | 'active' => {
    if (!contact) return 'none';
    if (contact.user_id) return 'active';
    if (contact.invited_at) return 'invited';
    return 'none';
  };

  const getEventStatus = (event: ClientEvent): 'draft' | 'closed' | 'active' => {
    if (event.status === 'draft') return 'draft';
    if (event.status === 'closed') return 'closed';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (event.close_date) {
      const closeDate = parseLocalDate(event.close_date);
      closeDate.setHours(0, 0, 0, 0);
      if (closeDate < today) return 'closed';
    }

    return 'active';
  };

  const totalGuests = events.reduce((acc, e) => acc + (e.event_attendees?.[0]?.count || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contact) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold">{contact.contact_name}</h1>
              <Badge
                variant="outline"
                className={
                  contact.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30'
                    : 'bg-muted text-muted-foreground'
                }
              >
                {contact.status === 'active' ? 'Activo' : 'Archivado'}
              </Badge>
            </div>
            {contact.companies?.name && (
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <Building2 className="w-4 h-4" />
                {contact.companies.name}
              </p>
            )}
          </div>
          {contact.status === 'active' && (
            <Button variant="outline" onClick={openEditDialog}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
        </div>

        {/* Contact Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Sin email</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                    {contact.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Sin teléfono</span>
                )}
              </div>
            </div>
            <div>
              <Badge variant="secondary">
                {contact.contact_type === 'couple' ? 'Pareja' : 'Wedding Planner'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Portal Status */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium">Portal de Clientes</div>
                {getPortalStatus() === 'active' ? (
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                    <UserCheck className="w-3 h-3 mr-1" />
                    Portal activo
                  </Badge>
                ) : getPortalStatus() === 'invited' ? (
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-700 border-blue-500/30">
                    <Send className="w-3 h-3 mr-1" />
                    Invitado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    Sin invitar
                  </Badge>
                )}
              </div>
              {contact.status === 'active' && !contact.user_id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleInviteToPortal}
                  disabled={!contact.email || isInviting}
                >
                  {isInviting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {contact.invited_at ? "Reenviar Invitación" : "Invitar al Portal"}
                </Button>
              )}
            </div>
            {!contact.email && !contact.user_id && (
              <p className="text-xs text-muted-foreground mt-2">
                Se necesita un email para invitar al portal
              </p>
            )}
            {contact.email && contact.invited_at && (
              <div className="mt-3 flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                  {`${window.location.origin}/portal/register?email=${encodeURIComponent(contact.email)}`}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const url = `${window.location.origin}/portal/register?email=${encodeURIComponent(contact.email!)}`;
                    await navigator.clipboard.writeText(url);
                    toast.success("Enlace copiado al portapapeles");
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">{events.length}</div>
              <p className="text-sm text-muted-foreground">Total Eventos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-emerald-500">{totalGuests}</div>
              <p className="text-sm text-muted-foreground">Total Invitados</p>
            </CardContent>
          </Card>
        </div>

        {/* Events Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Eventos
            </CardTitle>
            <Button
              size="sm"
              onClick={() => navigate(`/admin?createEventForContact=${contact.id}`)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Evento
            </Button>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Este cliente no tiene eventos aún
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Invitados</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                              {event.image_url ? (
                                <img
                                  src={event.image_url}
                                  alt={event.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <span className="font-medium">{event.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {event.date
                            ? format(parseLocalDate(event.date), "dd MMM yyyy", { locale: es })
                            : <span className="text-muted-foreground">Sin fecha</span>
                          }
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              getEventStatus(event) === 'draft'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                : getEventStatus(event) === 'closed'
                                  ? 'bg-muted text-muted-foreground'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            }
                          >
                            {getEventStatus(event) === 'draft' ? 'Borrador' : getEventStatus(event) === 'closed' ? 'Cerrado' : 'Activo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{event.event_attendees?.[0]?.count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/event/${event.id}`)}
                          >
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Notas
              {isSavingNotes && (
                <span className="text-sm text-muted-foreground font-normal flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Guardando...
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Agregar notas sobre este cliente..."
              value={notes}
              onChange={handleNotesChange}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        {contact.status === 'active' && (
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    <Archive className="w-4 h-4 mr-2" />
                    Archivar Cliente
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archivar Cliente</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción archivará al cliente. El cliente no aparecerá en la lista de clientes activos pero sus datos se conservarán.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
                      {isArchiving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Archivando...
                        </>
                      ) : (
                        "Archivar"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Client Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Editar Cliente</DialogTitle>
                <DialogDescription className="mt-1">
                  Modifica la información del cliente
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-5">
            {/* Client Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipo de Cliente</Label>
              <RadioGroup
                value={editFormData.contactType}
                onValueChange={(value) => setEditFormData(prev => ({
                  ...prev,
                  contactType: value as "couple" | "wedding_planner",
                  companyId: value === "couple" ? "" : prev.companyId,
                  newCompanyName: value === "couple" ? "" : prev.newCompanyName,
                }))}
                className="grid grid-cols-2 gap-3"
              >
                <label
                  htmlFor="edit-type-couple"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    editFormData.contactType === "couple"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                >
                  <RadioGroupItem value="couple" id="edit-type-couple" />
                  <div>
                    <p className="font-medium">Pareja</p>
                    <p className="text-xs text-muted-foreground">Cliente directo</p>
                  </div>
                </label>
                <label
                  htmlFor="edit-type-planner"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    editFormData.contactType === "wedding_planner"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                >
                  <RadioGroupItem value="wedding_planner" id="edit-type-planner" />
                  <div>
                    <p className="font-medium">Wedding Planner</p>
                    <p className="text-xs text-muted-foreground">Con empresa</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-contactName" className="text-sm font-medium">Nombre del Contacto *</Label>
              <Input
                id="edit-contactName"
                value={editFormData.contactName}
                onChange={(e) => setEditFormData(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="ej., Ana García"
                className="h-11"
              />
            </div>

            {/* Client Email & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@ejemplo.com"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-sm font-medium">Teléfono</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+52 55 1234 5678"
                  className="h-11"
                />
              </div>
            </div>

            {/* Company - Only for wedding planners */}
            {editFormData.contactType === "wedding_planner" && (
              <div className="space-y-2 p-4 bg-muted/30 rounded-xl">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Empresa
                </Label>
                {!showNewCompanyInput ? (
                  <div className="flex gap-2">
                    <Select
                      value={editFormData.companyId}
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, companyId: value }))}
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
                        setEditFormData(prev => ({ ...prev, companyId: "" }));
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={editFormData.newCompanyName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, newCompanyName: e.target.value }))}
                      placeholder="Nombre de la nueva empresa"
                      className="flex-1 h-11"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewCompanyInput(false);
                        setEditFormData(prev => ({ ...prev, newCompanyName: "" }));
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isUpdating} className="h-11">
              Cancelar
            </Button>
            <Button onClick={handleUpdateClient} disabled={isUpdating} className="h-11 px-6">
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClientDetail;
