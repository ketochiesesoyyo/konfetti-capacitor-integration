import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Users, Mail, Phone, MessageSquare, Clock, Loader2, Plus, LinkIcon, Building2, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { isAdminDomainAllowed } from "@/lib/domain";
import { parseLocalDate } from "@/lib/utils";
import { AdminEventCreationDialog } from "@/components/admin/AdminEventCreationDialog";
import { AdminEventSuccessDialog } from "@/components/admin/AdminEventSuccessDialog";
import { DashboardTab } from "@/components/admin/tabs/DashboardTab";
import { LeadsTab } from "@/components/admin/tabs/LeadsTab";
import { ClientsTab } from "@/components/admin/tabs/ClientsTab";
import { EventsTab } from "@/components/admin/tabs/EventsTab";

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
  event_id: string | null;
  contact_name: string | null;
  company_name: string | null;
  events: { name: string } | null;
}

interface HostedEvent {
  id: string;
  name: string;
  date: string | null;
  status: string;
  invite_code: string;
  image_url: string | null;
  close_date: string;
  created_at: string;
  contact_id: string | null;
  // Financial fields
  price: number | null;
  currency: string;
  commission_type: string | null;
  commission_value: number | null;
  payment_status: string;
  event_attendees: { count: number }[];
  contacts: { contact_name: string } | null;
}

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
  events: { id: string }[];
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente", color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400" },
  { value: "contacted", label: "Contactado", color: "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:text-blue-400" },
  { value: "paid", label: "Pagado", color: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" },
  { value: "lost", label: "Perdido", color: "bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400" },
];

const Admin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [hostedEvents, setHostedEvents] = useState<HostedEvent[]>([]);
  const [clients, setClients] = useState<Contact[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Event creation dialogs
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [requestForEventCreation, setRequestForEventCreation] = useState<EventRequest | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string>("");
  const [createdInviteCode, setCreatedInviteCode] = useState<string>("");

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    // Check domain first
    if (!isAdminDomainAllowed()) {
      navigate("/dashboard");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    const { data: hasAdminRole } = await supabase
      .rpc('has_role', { _user_id: session.user.id, _role: 'admin' });

    if (!hasAdminRole) {
      toast.error("Acceso denegado. Solo administradores.");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    await Promise.all([
      loadRequests(),
      loadHostedEvents(session.user.id),
      loadClients(),
    ]);
  };

  const loadRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('event_requests')
      .select('*, events(name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Error al cargar solicitudes");
      console.error(error);
    } else {
      setRequests(data || []);
    }
    setIsLoading(false);
  };

  const loadHostedEvents = async (adminUserId: string) => {
    const { data, error } = await supabase
      .from('events')
      .select('*, event_attendees(count), contacts(contact_name)')
      .eq('created_by', adminUserId)
      .order('date', { ascending: false });

    if (error) {
      toast.error("Error al cargar eventos");
      console.error(error);
    } else {
      setHostedEvents((data || []) as HostedEvent[]);
    }
  };

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*, companies(name), events(id)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Error al cargar contactos");
      console.error(error);
    } else {
      setClients((data || []) as Contact[]);
    }
  };

  const updateStatus = async (requestId: string, newStatus: string) => {
    // If changing to "paid", open the event creation dialog
    if (newStatus === "paid") {
      const request = requests.find(r => r.id === requestId);
      if (request && !request.event_id) {
        setRequestForEventCreation(request);
        setCreateEventDialogOpen(true);
        return;
      }
    }

    setUpdatingStatus(requestId);
    const { error } = await supabase
      .from('event_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      toast.error("Error al actualizar estado");
      console.error(error);
    } else {
      toast.success("Estado actualizado");
      setRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, status: newStatus, updated_at: new Date().toISOString() } : r
      ));
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
    setUpdatingStatus(null);
  };

  const handleEventCreated = async (eventId: string, inviteCode: string, contactId?: string) => {
    setCreateEventDialogOpen(false);
    setCreatedEventId(eventId);
    setCreatedInviteCode(inviteCode);
    setSuccessDialogOpen(true);

    // Update the request in local state
    if (requestForEventCreation) {
      setRequests(prev => prev.map(r =>
        r.id === requestForEventCreation.id
          ? { ...r, status: 'paid', event_id: eventId, updated_at: new Date().toISOString() }
          : r
      ));
      if (selectedRequest?.id === requestForEventCreation.id) {
        setSelectedRequest(prev => prev ? { ...prev, status: 'paid', event_id: eventId } : null);
      }
    }

    setRequestForEventCreation(null);
    toast.success("Evento creado exitosamente");

    // Reload data
    if (userId) {
      await Promise.all([
        loadHostedEvents(userId),
        loadClients(),
      ]);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return (
      <Badge variant="outline" className={statusOption.color}>
        {statusOption.label}
      </Badge>
    );
  };

  const openDetails = (request: EventRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  // Count calculations
  const leadsCount = requests.filter(r => r.status === 'pending' || r.status === 'contacted').length;
  const clientsCount = clients.filter(c => c.status === 'active').length;
  const eventsCount = hostedEvents.length;
  const paidRequests = requests.filter(r => r.status === 'paid').length;
  const totalLeadsAndClients = requests.length;
  const conversionRate = totalLeadsAndClients > 0 ? (paidRequests / totalLeadsAndClients) * 100 : 0;

  // Revenue calculations - default to MXN for display
  const defaultCurrency = "MXN";
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Calculate total revenue from paid events (null-safe for pre-migration data)
  const totalRevenue = hostedEvents
    .filter(e => e.payment_status === 'paid' && e.price)
    .reduce((sum, e) => sum + (e.price || 0), 0);

  // Calculate revenue this month
  const revenueThisMonth = hostedEvents
    .filter(e => {
      if (!e.date || e.payment_status !== 'paid' || !e.price) return false;
      const eventDate = new Date(e.date);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    })
    .reduce((sum, e) => sum + (e.price || 0), 0);

  // Calculate pending payments (events with price but not fully paid)
  const pendingPayments = hostedEvents
    .filter(e => e.price && (!e.payment_status || e.payment_status === 'pending' || e.payment_status === 'partial'))
    .reduce((sum, e) => sum + (e.price || 0), 0);

  // Calculate total commissions
  const commissionsTotal = hostedEvents
    .filter(e => e.commission_type && e.commission_value)
    .reduce((sum, e) => {
      if (!e.commission_value || !e.price) return sum;
      if (e.commission_type === 'percentage') {
        return sum + (e.price * e.commission_value / 100);
      }
      return sum + e.commission_value;
    }, 0);

  const revenueMetrics = {
    totalRevenue: { [defaultCurrency]: totalRevenue },
    revenueThisMonth: { [defaultCurrency]: revenueThisMonth },
    pendingPayments: { [defaultCurrency]: pendingPayments },
    commissionsTotal: { [defaultCurrency]: commissionsTotal },
  };

  // Upcoming events this month (all events, not just those with financial data)
  const upcomingEvents = hostedEvents
    .filter(e => {
      if (!e.date) return false;
      const eventDate = new Date(e.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today && eventDate <= endOfMonth;
    })
    .map(e => ({
      ...e,
      currency: e.currency || 'MXN',
      payment_status: e.payment_status || 'pending',
    }))
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  if (!isAdmin && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCreateEvent = () => {
    setRequestForEventCreation(null);
    setCreateEventDialogOpen(true);
  };

  // Section titles for the header
  const sectionTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: "Panel de Control", subtitle: "Resumen general de tu negocio" },
    leads: { title: "Leads", subtitle: "Gestiona las solicitudes de eventos" },
    clients: { title: "Contactos", subtitle: "Tu cartera de contactos" },
    events: { title: "Eventos", subtitle: "Todos tus eventos creados" },
  };

  const currentSection = sectionTitles[activeTab] || sectionTitles.dashboard;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar
        activeSection={activeTab}
        onSectionChange={setActiveTab}
        onCreateEvent={handleCreateEvent}
        leadsCount={leadsCount}
        clientsCount={clientsCount}
        eventsCount={eventsCount}
      />

      {/* Main Content */}
      <div className="flex-1 md:ml-0">
        {/* Mobile spacer for fixed header */}
        <div className="h-14 md:hidden" />

        <div className="p-4 md:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">{currentSection.title}</h1>
            <p className="text-muted-foreground">{currentSection.subtitle}</p>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeTab === "dashboard" && (
              <DashboardTab
                leadsCount={leadsCount}
                clientsCount={clientsCount}
                eventsCount={eventsCount}
                conversionRate={conversionRate}
                revenueMetrics={revenueMetrics}
                upcomingEvents={upcomingEvents}
              />
            )}

            {activeTab === "leads" && (
              <LeadsTab
                requests={requests}
                isLoading={isLoading}
                updatingStatus={updatingStatus}
                onUpdateStatus={updateStatus}
                onOpenDetails={openDetails}
              />
            )}

            {activeTab === "clients" && (
              <ClientsTab clients={clients} isLoading={isLoading} onClientCreated={loadClients} />
            )}

            {activeTab === "events" && (
              <EventsTab
                events={hostedEvents}
                isLoading={isLoading}
                onEventUpdated={() => userId && loadHostedEvents(userId)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedRequest && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedRequest.partner1_name} & {selectedRequest.partner2_name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.submitter_type === 'wedding_planner' ? 'Vía Wedding Planner' : 'Solicitud directa'}
                      </p>
                    </div>
                  </div>
                </div>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {/* Event Created Banner */}
              {selectedRequest.event_id && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <LinkIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-700 dark:text-emerald-400">Evento creado</p>
                        <p className="text-sm text-emerald-600/70">El evento ya está activo</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/event-dashboard/${selectedRequest.event_id}?from=admin`)}
                      className="border-emerald-500/30 hover:bg-emerald-500/10"
                    >
                      Ver Dashboard
                    </Button>
                  </div>
                </div>
              )}

              {/* Main Info Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Event Details Card */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Detalles del Evento
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fecha de la Boda</p>
                        <p className="font-medium">{format(parseLocalDate(selectedRequest.wedding_date), "d 'de' MMMM, yyyy", { locale: es })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Invitados Solteros</p>
                        <p className="font-medium">{selectedRequest.expected_guests} personas</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Details Card */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Información de Contacto
                  </h3>
                  <div className="space-y-3">
                    {selectedRequest.contact_name && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Nombre del Contacto</p>
                          <p className="font-medium">{selectedRequest.contact_name}</p>
                        </div>
                      </div>
                    )}
                    {selectedRequest.company_name && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Empresa</p>
                          <p className="font-medium">{selectedRequest.company_name}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <a href={`mailto:${selectedRequest.email}`} className="font-medium text-primary hover:underline">
                          {selectedRequest.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Teléfono</p>
                        <a href={`tel:${selectedRequest.phone}`} className="font-medium text-primary hover:underline">
                          {selectedRequest.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Section */}
              {selectedRequest.message && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      Mensaje
                    </h3>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedRequest.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Recibido el {format(new Date(selectedRequest.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {!selectedRequest.event_id && (
                  <Button
                    onClick={() => {
                      setRequestForEventCreation(selectedRequest);
                      setIsDialogOpen(false);
                      setCreateEventDialogOpen(true);
                    }}
                    className="flex-1"
                    size="lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Evento
                  </Button>
                )}
                <Select
                  value={selectedRequest.status}
                  onValueChange={(value) => updateStatus(selectedRequest.id, value)}
                  disabled={updatingStatus === selectedRequest.id}
                >
                  <SelectTrigger className={`h-11 ${selectedRequest.event_id ? "flex-1" : "w-[180px]"}`}>
                    {updatingStatus === selectedRequest.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SelectValue placeholder="Cambiar estado" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Creation Dialog */}
      <AdminEventCreationDialog
        open={createEventDialogOpen}
        onOpenChange={setCreateEventDialogOpen}
        request={requestForEventCreation}
        userId={userId}
        onEventCreated={handleEventCreated}
      />

      {/* Event Success Dialog */}
      <AdminEventSuccessDialog
        open={successDialogOpen}
        onOpenChange={setSuccessDialogOpen}
        eventId={createdEventId}
        inviteCode={createdInviteCode}
      />
    </div>
  );
};

export default Admin;
