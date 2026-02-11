import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  UserX,
  Share2,
  Copy,
  Camera,
  X,
  Users,
  Heart,
  Sparkles,
  Calendar,
  Clock,
  MoreVertical,
  Settings,
  Link as LinkIcon,
  DollarSign,
  Loader2,
  ExternalLink,
  Pencil,
  Building2,
  Mail,
  Phone,
  Percent,
  User,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { parseLocalDate, formatLocalDate } from "@/lib/utils";
import { eventSchema } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { useAdminContext } from "@/components/admin/AdminLayout";

const AdminEventDashboard = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { refreshCounts } = useAdminContext();

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [closeEventDialogOpen, setCloseEventDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [guestsDialogOpen, setGuestsDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [loading, setLoading] = useState(true);

  // Event data
  const [event, setEvent] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalGuests: 0,
    totalLikes: 0,
    matchesCreated: 0,
    topActive: [] as { name: string; swipes: number }[],
  });

  // Edit mode for settings
  const [isSaving, setIsSaving] = useState(false);
  const [editedEvent, setEditedEvent] = useState({
    name: "",
    description: "",
    date: "",
    close_date: "",
  });
  const [matchmakingOption, setMatchmakingOption] = useState<string>("immediately");

  // Image editing
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [isHostAttendee, setIsHostAttendee] = useState(false);

  // Contact info
  const [contact, setContact] = useState<{
    id: string;
    contact_name: string;
    contact_type: string;
    email: string | null;
    phone: string | null;
    company_id: string | null;
    companies: { name: string } | null;
  } | null>(null);

  // Edit financial dialog
  const [editFinancialDialogOpen, setEditFinancialDialogOpen] = useState(false);
  const [isSavingFinancial, setIsSavingFinancial] = useState(false);
  const [clients, setClients] = useState<{
    id: string;
    contact_name: string;
    contact_type: string;
    companies: { name: string } | null;
  }[]>([]);
  const [financialFormData, setFinancialFormData] = useState({
    contactId: "",
    price: "",
    currency: "MXN",
    commissionType: "" as "" | "percentage" | "fixed",
    commissionValue: "",
    paymentStatus: "pending",
  });

  const MATCHMAKING_OPTIONS = [
    { value: "immediately", label: "Inmediatamente al unirse" },
    { value: "1_week_before", label: "1 semana antes del evento" },
    { value: "2_weeks_before", label: "2 semanas antes del evento" },
    { value: "day_of_event", label: "El día del evento" },
  ];

  const determineMatchmakingOption = (eventDate: string, startDate: string | null): string => {
    if (!startDate || startDate === "") return "immediately";
    const ev = parseLocalDate(eventDate);
    const start = parseLocalDate(startDate);
    const daysDiff = Math.round(
      (ev.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff === 0) return "day_of_event";
    if (daysDiff === 7) return "1_week_before";
    if (daysDiff === 14) return "2_weeks_before";
    return "immediately";
  };

  const calculateMatchmakingStartDate = (option: string, eventDate: string): string | null => {
    if (!eventDate) return null;
    const ev = parseLocalDate(eventDate);
    switch (option) {
      case "1_week_before": {
        const d = new Date(ev);
        d.setDate(d.getDate() - 7);
        return formatLocalDate(d);
      }
      case "2_weeks_before": {
        const d = new Date(ev);
        d.setDate(d.getDate() - 14);
        return formatLocalDate(d);
      }
      case "day_of_event":
        return eventDate;
      case "immediately":
      default:
        return null;
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId || "")
        .eq("created_by", user.id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);
      setEditedEvent({
        name: eventData.name,
        description: eventData.description || "",
        date: eventData.date,
        close_date: eventData.close_date,
      });
      setMatchmakingOption(
        determineMatchmakingOption(eventData.date, eventData.matchmaking_start_date)
      );

      if (eventData.image_url) {
        setImagePreview(eventData.image_url);
      }

      // Load contact info if exists
      if (eventData.contact_id) {
        const { data: contactData } = await supabase
          .from('contacts')
          .select('id, contact_name, contact_type, email, phone, company_id, companies(name)')
          .eq('id', eventData.contact_id)
          .single();

        if (contactData) {
          setContact(contactData as typeof contact);
        }
      } else {
        setContact(null);
      }

      const { data: hostAttendeeCheck } = await supabase
        .from("event_attendees")
        .select("id")
        .eq("event_id", eventId || "")
        .eq("user_id", user.id)
        .maybeSingle();

      setIsHostAttendee(!!hostAttendeeCheck);

      const { data: attendeesData, error: attendeesError } = await supabase
        .from("event_attendees")
        .select(`
          *,
          profiles (
            id,
            user_id,
            name,
            photos
          )
        `)
        .eq("event_id", eventId || "");

      if (attendeesError) throw attendeesError;
      setGuests(attendeesData || []);

      await fetchStats();
    } catch (error: any) {
      console.error("Error fetching event data:", error);
      toast.error("Error al cargar el evento");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: guestsCount } = await supabase
        .from("event_attendees")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId || "");

      const { count: likesCount } = await supabase
        .from("swipes")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId || "")
        .eq("direction", "right");

      const { count: matchesCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId || "");

      const { data: swipesData } = await supabase
        .from("swipes")
        .select(`user_id, profiles (name)`)
        .eq("event_id", eventId || "");

      const swipesByUser: Record<string, { name: string; count: number }> = {};
      swipesData?.forEach((swipe: any) => {
        const userId = swipe.user_id;
        const name = swipe.profiles?.name || "Unknown";
        if (!swipesByUser[userId]) {
          swipesByUser[userId] = { name, count: 0 };
        }
        swipesByUser[userId].count++;
      });

      const topActive = Object.values(swipesByUser)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map((user) => ({ name: user.name, swipes: user.count }));

      setStats({
        totalGuests: guestsCount || 0,
        totalLikes: likesCount || 0,
        matchesCreated: matchesCount || 0,
        topActive,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleRemoveGuest = async () => {
    if (!removalReason) {
      toast.error("Por favor selecciona una razón");
      return;
    }

    try {
      const { error } = await supabase
        .from("event_attendees")
        .delete()
        .eq("event_id", eventId || "")
        .eq("user_id", selectedGuest.user_id);

      if (error) throw error;

      toast.success(`${selectedGuest.profiles?.name} ha sido eliminado`);
      setRemoveDialogOpen(false);
      setSelectedGuest(null);
      setRemovalReason("");
      fetchEventData();
    } catch (error: any) {
      console.error("Error removing guest:", error);
      toast.error("Error al eliminar invitado");
    }
  };

  const handleChatWithGuest = (guest: any) => {
    navigate(`/chat/${guest.user_id}`, {
      state: {
        userId: guest.user_id,
        name: guest.profiles?.name || "Invitado",
        photo: guest.profiles?.photos?.[0] || "/placeholder.svg",
        eventName: event.name,
        eventId: eventId,
        isDirectChat: true,
        fromAdmin: true,
      }
    });
  };

  const handleSaveEvent = async () => {
    try {
      setIsSaving(true);

      const validationResult = eventSchema.safeParse({
        name: editedEvent.name,
        description: editedEvent.description,
        date: editedEvent.date,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      let imageUrl = imagePreview;

      if (eventImage && !imagePreview.startsWith('http')) {
        const fileExt = eventImage.name.split('.').pop();
        const fileName = `${eventId}-${Date.now()}.${fileExt}`;

        if (event.image_url) {
          const oldFileName = event.image_url.split('/').pop();
          await supabase.storage.from('event-photos').remove([oldFileName]);
        }

        const { error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(fileName, eventImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-photos')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      let closeDate = editedEvent.close_date;
      if (editedEvent.date !== event.date) {
        closeDate = format(addDays(parseLocalDate(editedEvent.date), 3), "yyyy-MM-dd");
      }

      const validated = validationResult.data;
      const matchmakingStartDate = calculateMatchmakingStartDate(matchmakingOption, editedEvent.date);
      const { error } = await supabase
        .from("events")
        .update({
          name: validated.name,
          description: validated.description,
          date: validated.date,
          close_date: closeDate,
          image_url: imageUrl,
          matchmaking_start_date: matchmakingStartDate,
          matchmaking_start_time: matchmakingStartDate ? `${matchmakingStartDate}T00:00:00` : null,
        })
        .eq("id", eventId || "");

      if (error) throw error;

      toast.success("Evento actualizado");
      setEventImage(null);
      setSettingsDialogOpen(false);
      fetchEventData();
      refreshCounts();
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast.error("Error al actualizar evento");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("La imagen debe ser menor a 10MB");
        return;
      }

      setTempImageFile(file);
      const url = URL.createObjectURL(file);
      setTempImageUrl(url);
      setCropDialogOpen(true);
    }
  };

  const handleCropComplete = (croppedImage: Blob) => {
    const file = new File([croppedImage], tempImageFile?.name || "event-image.jpg", {
      type: "image/jpeg",
    });
    setEventImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(croppedImage);

    setCropDialogOpen(false);
    URL.revokeObjectURL(tempImageUrl);
  };

  const handleRemoveImage = () => {
    setEventImage(null);
    setImagePreview(event?.image_url || "");
  };

  const handleCloseEvent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Autenticación requerida");
        return;
      }

      const newCloseDate = format(addDays(new Date(), 3), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("events")
        .update({
          status: "closed",
          close_date: newCloseDate
        })
        .eq("id", eventId || "")
        .eq("created_by", user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("No se pudo actualizar el evento");
      }

      toast.success("Evento cerrado exitosamente");
      setCloseEventDialogOpen(false);
      await fetchEventData();
      refreshCounts();
    } catch (error: any) {
      console.error("Error closing event:", error);
      toast.error(error.message || "Error al cerrar evento");
    }
  };

  const eventCode = event?.invite_code || "";
  const eventLink = `${window.location.origin}/join/${eventCode}`;

  const CURRENCY_OPTIONS = [
    { value: "MXN", label: "MXN (Peso Mexicano)" },
    { value: "USD", label: "USD (Dólar)" },
    { value: "INR", label: "INR (Rupia India)" },
  ];

  const PAYMENT_STATUS_OPTIONS = [
    { value: "pending", label: "Pendiente" },
    { value: "partial", label: "Parcial" },
    { value: "paid", label: "Pagado" },
  ];

  const loadClients = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('id, contact_name, contact_type, companies(name)')
      .eq('status', 'active')
      .order('contact_name');
    if (data) {
      setClients(data as typeof clients);
    }
  };

  const openEditFinancialDialog = async () => {
    try {
      await loadClients();
      setFinancialFormData({
        contactId: event?.contact_id || "__none__",
        price: event?.price?.toString() || "",
        currency: event?.currency || "MXN",
        commissionType: event?.commission_type || "",
        commissionValue: event?.commission_value?.toString() || "",
        paymentStatus: event?.payment_status || "pending",
      });
      setEditFinancialDialogOpen(true);
    } catch (error) {
      console.error("Error opening financial dialog:", error);
      toast.error("Error al cargar datos");
    }
  };

  const handleSaveFinancial = async () => {
    try {
      setIsSavingFinancial(true);

      const priceValue = financialFormData.price ? parseFloat(financialFormData.price) : null;
      const commissionValue = financialFormData.commissionValue ? parseFloat(financialFormData.commissionValue) : null;
      const contactIdValue = financialFormData.contactId === "__none__" ? null : financialFormData.contactId;

      const { error } = await supabase
        .from("events")
        .update({
          contact_id: contactIdValue || null,
          price: priceValue,
          currency: financialFormData.currency,
          commission_type: financialFormData.commissionType || null,
          commission_value: commissionValue,
          payment_status: financialFormData.paymentStatus,
        })
        .eq("id", eventId || "");

      if (error) throw error;

      toast.success("Evento actualizado");
      setEditFinancialDialogOpen(false);
      fetchEventData();
      refreshCounts();
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast.error("Error al actualizar evento");
    } finally {
      setIsSavingFinancial(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventLink);
    toast.success("Enlace copiado");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(eventCode);
    toast.success("Código copiado");
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { MXN: "$", USD: "$", INR: "₹" };
    return `${symbols[currency] || "$"}${amount.toLocaleString()}`;
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">Pagado</Badge>;
      case "partial":
        return <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">Parcial</Badge>;
      default:
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Pendiente</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'closed') {
      return <Badge variant="secondary">Cerrado</Badge>;
    }
    return <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">Activo</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Evento no encontrado</p>
          <Button onClick={() => navigate('/admin/events')}>Volver a Eventos</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {event.image_url && (
            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
              <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{event.name}</h1>
            <p className="text-muted-foreground">
              {format(parseLocalDate(event.date), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(event.status)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSettingsDialogOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/join/${eventCode}`)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver Landing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {event.status !== 'closed' && (
                <DropdownMenuItem
                  onClick={() => setCloseEventDialogOpen(true)}
                  className="text-destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cerrar Evento
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalGuests}</p>
              <p className="text-xs text-muted-foreground">Invitados</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.matchesCreated}</p>
              <p className="text-xs text-muted-foreground">Matches</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalLikes}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{format(parseLocalDate(event.date), "d")}</p>
              <p className="text-xs text-muted-foreground">{format(parseLocalDate(event.date), "MMM", { locale: es })}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Invite Code Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Código de Invitación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-lg px-4 py-3">
                  <p className="font-mono font-bold text-lg tracking-wide">{eventCode}</p>
                </div>
                <Button variant="outline" size="icon" onClick={handleCopyCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full" onClick={handleCopyLink}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Copiar Enlace
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/join/${eventCode}`)}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver Landing
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Client Info Card - Always visible */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Cliente
              </CardTitle>
              {contact && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openEditFinancialDialog}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Cambiar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {contact ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{contact.contact_name}</p>
                      <Badge variant="secondary" className="mt-1">
                        {contact.contact_type === 'couple' ? 'Pareja' : 'Wedding Planner'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/client/${contact.id}`)}
                    >
                      Ver Perfil
                    </Button>
                  </div>
                  {contact.companies?.name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{contact.companies.name}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <User className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-3">Sin cliente asignado</p>
                  <Button variant="outline" size="sm" onClick={openEditFinancialDialog}>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Asignar Cliente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Card */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Información Financiera
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={openEditFinancialDialog}>
                <Pencil className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </CardHeader>
            <CardContent>
              {event.price != null ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {event.price === 0 ? (
                          <span className="text-muted-foreground">Gratis / Regalo</span>
                        ) : (
                          formatCurrency(event.price, event.currency || 'MXN')
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">Precio del evento</p>
                    </div>
                    {event.price > 0 && getPaymentStatusBadge(event.payment_status || 'pending')}
                  </div>
                  {event.commission_type && event.commission_value && event.price > 0 && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Comisión</span>
                        <span className="font-medium">
                          {event.commission_type === 'percentage'
                            ? `${event.commission_value}%`
                            : formatCurrency(event.commission_value, event.currency || 'MXN')}
                        </span>
                      </div>
                      {event.commission_type === 'percentage' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Monto comisión</span>
                          <span className="font-medium text-emerald-600">
                            {formatCurrency(event.price * event.commission_value / 100, event.currency || 'MXN')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">Sin información financiera</p>
                  <Button variant="link" size="sm" onClick={openEditFinancialDialog}>
                    Agregar ahora
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Matchmaking Info */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Matchmaking
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSettingsDialogOpen(true)}>
                <Pencil className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Inicio</span>
                <span className="font-medium">
                  {event.matchmaking_start_date
                    ? format(parseLocalDate(event.matchmaking_start_date), "d MMM yyyy", { locale: es })
                    : 'Inmediato'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cierre</span>
                <span className="font-medium">
                  {format(parseLocalDate(event.close_date), "d MMM yyyy", { locale: es })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Guests */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Invitados Recientes
            </CardTitle>
            {guests.length > 5 && (
              <Button variant="ghost" size="sm" onClick={() => setGuestsDialogOpen(true)}>
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {guests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aún no hay invitados</p>
                <p className="text-sm">Comparte el código para que se unan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {guests.slice(0, 5).map((guest) => (
                  <div key={guest.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary to-pink-500 flex-shrink-0">
                      {guest.profiles?.photos?.[0] ? (
                        <img
                          src={guest.profiles.photos[0]}
                          alt={guest.profiles?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                          {guest.profiles?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{guest.profiles?.name || "Invitado"}</p>
                        {guest.user_id === event?.created_by && (
                          <Badge variant="secondary" className="text-xs">Host</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(guest.joined_at), "d MMM", { locale: es })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleChatWithGuest(guest)}>
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedGuest(guest);
                          setRemoveDialogOpen(true);
                        }}
                      >
                        <UserX className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {guests.length > 5 && (
                  <Button variant="outline" className="w-full" onClick={() => setGuestsDialogOpen(true)}>
                    Ver todos los invitados ({guests.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Join as Host Card */}
      {!isHostAttendee && (
        <Card className="bg-primary/5 border-primary/20 mt-6">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold">Unirte al Matchmaking</p>
              <p className="text-sm text-muted-foreground">Participa como invitado en tu propio evento</p>
            </div>
            <Button onClick={() => navigate(`/join/${event.invite_code}`)}>
              Unirme
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Most Active Section */}
      {stats.topActive.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Más Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {stats.topActive.map((user, idx) => (
                <div key={idx} className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.swipes} swipes</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Guests Dialog */}
      <Dialog open={guestsDialogOpen} onOpenChange={setGuestsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Todos los Invitados ({guests.length})</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {guests.map((guest) => (
              <div key={guest.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary to-pink-500 flex-shrink-0">
                  {guest.profiles?.photos?.[0] ? (
                    <img src={guest.profiles.photos[0]} alt={guest.profiles?.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                      {guest.profiles?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{guest.profiles?.name || "Invitado"}</p>
                    {guest.user_id === event?.created_by && <Badge variant="secondary" className="text-xs">Host</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(guest.joined_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleChatWithGuest(guest)}>
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedGuest(guest);
                      setRemoveDialogOpen(true);
                    }}
                  >
                    <UserX className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configuración del Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Evento</Label>
              <Input
                value={editedEvent.name}
                onChange={(e) => setEditedEvent({ ...editedEvent, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={editedEvent.description}
                onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha del Evento</Label>
              <Input
                type="date"
                value={editedEvent.date}
                onChange={(e) => setEditedEvent({ ...editedEvent, date: e.target.value })}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div className="space-y-2">
              <Label>Matchmaking</Label>
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
              {matchmakingOption !== "immediately" && editedEvent.date && (
                <p className="text-xs text-muted-foreground">
                  Inicio: {format(
                    parseLocalDate(calculateMatchmakingStartDate(matchmakingOption, editedEvent.date)!),
                    "d 'de' MMMM, yyyy",
                    { locale: es }
                  )}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Imagen del Evento</Label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="relative">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                      <img src={imagePreview} alt="Event" className="w-full h-full object-cover" />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="settings-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('settings-image-upload')?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {imagePreview ? "Cambiar" : "Agregar"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEvent} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Guest Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Invitado</DialogTitle>
            <DialogDescription>
              Esto eliminará todos sus matches y chats de este evento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Razón de eliminación</Label>
              <Select value={removalReason} onValueChange={setRemovalReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar razón" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-invited">No invitado a la boda</SelectItem>
                  <SelectItem value="duplicate">Perfil duplicado</SelectItem>
                  <SelectItem value="fake-info">Información falsa</SelectItem>
                  <SelectItem value="inappropriate">Contenido inapropiado</SelectItem>
                  <SelectItem value="behavior">Problemas de comportamiento</SelectItem>
                  <SelectItem value="not-attending">Ya no asistirá</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setRemoveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleRemoveGuest}>
                Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Event Dialog */}
      <AlertDialog open={closeEventDialogOpen} onOpenChange={setCloseEventDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar evento ahora?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El evento se cerrará permanentemente y no será posible más matchmaking.
              <br /><br />
              Los matches y chats existentes seguirán accesibles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cerrar Evento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Event Dialog */}
      <Dialog open={editFinancialDialogOpen} onOpenChange={setEditFinancialDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Editar Evento</DialogTitle>
                <DialogDescription className="mt-1">
                  Cliente asignado e información financiera
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-5">
            {/* Client Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Cliente Asignado
              </Label>
              <Select
                value={financialFormData.contactId}
                onValueChange={(value) => setFinancialFormData(prev => ({ ...prev, contactId: value }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin cliente asignado</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.contact_name}
                      {client.companies?.name && (
                        <span className="text-muted-foreground ml-2">({client.companies.name})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price and Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label className="text-sm font-medium">Precio</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={financialFormData.price}
                    onChange={(e) => setFinancialFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Moneda</Label>
                <Select
                  value={financialFormData.currency}
                  onValueChange={(value) => setFinancialFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger className="h-11">
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
                value={financialFormData.commissionType}
                onValueChange={(value) => setFinancialFormData(prev => ({
                  ...prev,
                  commissionType: value as "" | "percentage" | "fixed",
                  commissionValue: value === "" ? "" : prev.commissionValue,
                }))}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="fin-commission-none" />
                  <label htmlFor="fin-commission-none" className="text-sm cursor-pointer">Sin comisión</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="fin-commission-percentage" />
                  <label htmlFor="fin-commission-percentage" className="text-sm cursor-pointer">Porcentaje</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fin-commission-fixed" />
                  <label htmlFor="fin-commission-fixed" className="text-sm cursor-pointer">Monto fijo</label>
                </div>
              </RadioGroup>
            </div>

            {/* Commission Value */}
            {financialFormData.commissionType && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {financialFormData.commissionType === "percentage" ? "Porcentaje de Comisión" : "Monto de Comisión"}
                </Label>
                <div className="relative">
                  {financialFormData.commissionType === "percentage" ? (
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  ) : (
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  )}
                  <Input
                    type="number"
                    step={financialFormData.commissionType === "percentage" ? "1" : "0.01"}
                    min="0"
                    max={financialFormData.commissionType === "percentage" ? "100" : undefined}
                    value={financialFormData.commissionValue}
                    onChange={(e) => setFinancialFormData(prev => ({ ...prev, commissionValue: e.target.value }))}
                    placeholder={financialFormData.commissionType === "percentage" ? "15" : "1000.00"}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
            )}

            {/* Payment Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Estado de Pago</Label>
              <Select
                value={financialFormData.paymentStatus}
                onValueChange={(value) => setFinancialFormData(prev => ({ ...prev, paymentStatus: value }))}
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

          <div className="flex gap-2 justify-end border-t pt-4">
            <Button variant="outline" onClick={() => setEditFinancialDialogOpen(false)} disabled={isSavingFinancial} className="h-11">
              Cancelar
            </Button>
            <Button onClick={handleSaveFinancial} disabled={isSavingFinancial} className="h-11 px-6">
              {isSavingFinancial ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={cropDialogOpen}
        imageUrl={tempImageUrl}
        onClose={() => {
          setCropDialogOpen(false);
          URL.revokeObjectURL(tempImageUrl);
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default AdminEventDashboard;
