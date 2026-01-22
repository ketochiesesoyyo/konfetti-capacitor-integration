import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Users, Mail, Phone, MessageSquare, Clock, Loader2, Plus, LinkIcon, ImageIcon, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { isAdminDomainAllowed } from "@/lib/domain";
import { AdminEventCreationDialog } from "@/components/admin/AdminEventCreationDialog";
import { AdminEventSuccessDialog } from "@/components/admin/AdminEventSuccessDialog";

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
  event_attendees: { count: number }[];
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
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("requests");
  
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
    await Promise.all([loadRequests(), loadHostedEvents(session.user.id)]);
  };

  const loadRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('event_requests')
      .select('*')
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
      .select('*, event_attendees(count)')
      .eq('created_by', adminUserId)
      .order('date', { ascending: false });

    if (error) {
      toast.error("Error al cargar eventos");
      console.error(error);
    } else {
      setHostedEvents((data || []) as HostedEvent[]);
    }
  };

  const getEventStatus = (event: HostedEvent): 'draft' | 'closed' | 'active' => {
    if (event.status === 'draft') return 'draft';
    if (event.status === 'closed') return 'closed';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (event.close_date) {
      const closeDate = new Date(event.close_date);
      closeDate.setHours(0, 0, 0, 0);
      if (closeDate < today) return 'closed';
    }
    
    return 'active';
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

  const handleEventCreated = async (eventId: string, inviteCode: string) => {
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
    
    // Reload hosted events
    if (userId) {
      await loadHostedEvents(userId);
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

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    paid: requests.filter(r => r.status === 'paid').length,
  };

  const eventStats = {
    total: hostedEvents.length,
    active: hostedEvents.filter(e => getEventStatus(e) === 'active').length,
    draft: hostedEvents.filter(e => getEventStatus(e) === 'draft').length,
    closed: hostedEvents.filter(e => getEventStatus(e) === 'closed').length,
  };

  if (!isAdmin && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Panel de Administración</h1>
              <p className="text-muted-foreground">Gestión de solicitudes y eventos</p>
            </div>
          </div>
          <Button onClick={() => navigate("/create-event")} className="gap-2">
            <Plus className="w-4 h-4" />
            Crear Evento
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="requests">Solicitudes ({requests.length})</TabsTrigger>
            <TabsTrigger value="events">Eventos ({hostedEvents.length})</TabsTrigger>
          </TabsList>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-sm text-muted-foreground">Total solicitudes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-primary">{stats.contacted}</div>
                  <p className="text-sm text-muted-foreground">Contactados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-emerald-500">{stats.paid}</div>
                  <p className="text-sm text-muted-foreground">Pagados</p>
                </CardContent>
              </Card>
            </div>

            {/* Requests Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Solicitudes de Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay solicitudes de eventos
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pareja</TableHead>
                          <TableHead>Fecha Boda</TableHead>
                          <TableHead>Invitados</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Recibido</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((request) => (
                          <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetails(request)}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {request.partner1_name} & {request.partner2_name}
                                {request.event_id && (
                                  <Badge variant="secondary" className="text-xs">
                                    <LinkIcon className="w-3 h-3 mr-1" />
                                    Evento
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(request.wedding_date), "dd MMM yyyy", { locale: es })}
                            </TableCell>
                            <TableCell>{request.expected_guests}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {request.submitter_type === 'couple' ? 'Pareja' : 'Wedding Planner'}
                              </Badge>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Select 
                                value={request.status} 
                                onValueChange={(value) => updateStatus(request.id, value)}
                                disabled={updatingStatus === request.id}
                              >
                                <SelectTrigger className="w-[130px] h-8">
                                  {updatingStatus === request.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <SelectValue />
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
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(request.created_at), "dd/MM/yy HH:mm")}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">Ver</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            {/* Event Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{eventStats.total}</div>
                  <p className="text-sm text-muted-foreground">Total eventos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-emerald-500">{eventStats.active}</div>
                  <p className="text-sm text-muted-foreground">Activos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-amber-500">{eventStats.draft}</div>
                  <p className="text-sm text-muted-foreground">Borradores</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-muted-foreground">{eventStats.closed}</div>
                  <p className="text-sm text-muted-foreground">Cerrados</p>
                </CardContent>
              </Card>
            </div>

            {/* Events Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Eventos Creados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : hostedEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-4">No hay eventos creados</p>
                    <Button onClick={() => navigate("/create-event")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear primer evento
                    </Button>
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
                          <TableHead>Código</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hostedEvents.map((event) => (
                          <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/event-dashboard/${event.id}?from=admin`)}>
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
                                ? format(new Date(event.date), "dd MMM yyyy", { locale: es })
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
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {getEventStatus(event) !== 'draft' && (
                                <div className="flex items-center gap-2">
                                  <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                    {event.invite_code}
                                  </code>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(event.invite_code, "Código copiado")}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                {getEventStatus(event) === 'draft' ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => navigate(`/create-event?edit=${event.id}`)}
                                  >
                                    Completar
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => navigate(`/event-dashboard/${event.id}?from=admin`)}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Gestionar
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles de Solicitud</DialogTitle>
            <DialogDescription>
              Información completa de la solicitud de evento
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">
                  {selectedRequest.partner1_name} & {selectedRequest.partner2_name}
                </span>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {selectedRequest.event_id && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      Evento creado
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/event-dashboard/${selectedRequest.event_id}?from=admin`)}
                    >
                      Ver Dashboard
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{format(new Date(selectedRequest.wedding_date), "dd MMMM yyyy", { locale: es })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedRequest.expected_guests} invitados solteros</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${selectedRequest.email}`} className="text-primary hover:underline">
                    {selectedRequest.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${selectedRequest.phone}`} className="text-primary hover:underline">
                    {selectedRequest.phone}
                  </a>
                </div>
              </div>

              {selectedRequest.message && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    Mensaje
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {selectedRequest.message}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Clock className="w-3 h-3" />
                Recibido: {format(new Date(selectedRequest.created_at), "dd/MM/yyyy HH:mm")}
              </div>

              <div className="flex gap-2 pt-2">
                {!selectedRequest.event_id && (
                  <Button
                    onClick={() => {
                      setRequestForEventCreation(selectedRequest);
                      setIsDialogOpen(false);
                      setCreateEventDialogOpen(true);
                    }}
                    className="flex-1"
                  >
                    Crear Evento
                  </Button>
                )}
                <Select 
                  value={selectedRequest.status} 
                  onValueChange={(value) => updateStatus(selectedRequest.id, value)}
                  disabled={updatingStatus === selectedRequest.id}
                >
                  <SelectTrigger className={selectedRequest.event_id ? "flex-1" : ""}>
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
