import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Users, Mail, Phone, MessageSquare, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { isAdminDomainAllowed } from "@/lib/domain";

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
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente", color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30" },
  { value: "contacted", label: "Contactado", color: "bg-blue-500/20 text-blue-700 border-blue-500/30" },
  { value: "approved", label: "Aprobado", color: "bg-green-500/20 text-green-700 border-green-500/30" },
  { value: "rejected", label: "Rechazado", color: "bg-red-500/20 text-red-700 border-red-500/30" },
];

const Admin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

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

    const { data: hasAdminRole } = await supabase
      .rpc('has_role', { _user_id: session.user.id, _role: 'admin' });

    if (!hasAdminRole) {
      toast.error("Acceso denegado. Solo administradores.");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    await loadRequests();
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

  const updateStatus = async (requestId: string, newStatus: string) => {
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

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    approved: requests.filter(r => r.status === 'approved').length,
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-muted-foreground">Gestión de solicitudes de eventos</p>
          </div>
        </div>

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
              <div className="text-2xl font-bold text-emerald-500">{stats.approved}</div>
              <p className="text-sm text-muted-foreground">Aprobados</p>
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
                          {request.partner1_name} & {request.partner2_name}
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
                <Select 
                  value={selectedRequest.status} 
                  onValueChange={(value) => updateStatus(selectedRequest.id, value)}
                  disabled={updatingStatus === selectedRequest.id}
                >
                  <SelectTrigger className="flex-1">
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
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
