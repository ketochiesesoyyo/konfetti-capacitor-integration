import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Loader2, Plus, ImageIcon, Copy, ExternalLink, Pencil, DollarSign, Percent, UserCheck, Filter, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseLocalDate } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SortableTableHeader } from "../shared/SortableTableHeader";
import { StatsCard } from "../shared/StatsCard";

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
  companies: { name: string } | null;
}

type SortColumn = 'name' | 'date' | 'created_at' | 'status' | 'guests' | 'client' | 'price' | 'payment';

interface EventsTabProps {
  events: HostedEvent[];
  isLoading: boolean;
  onEventUpdated?: () => void;
}

const CURRENCY_OPTIONS = [
  { value: "MXN", label: "MXN" },
  { value: "USD", label: "USD" },
  { value: "INR", label: "INR" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "partial", label: "Parcial" },
  { value: "paid", label: "Pagado" },
];

type StatusFilter = 'all' | 'active' | 'draft' | 'closed';
type PaymentFilter = 'all' | 'pending' | 'partial' | 'paid';
type DateFilter = 'all' | 'upcoming' | 'this_month' | 'next_month' | 'past';

export const EventsTab = ({ events, isLoading, onEventUpdated }: EventsTabProps) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortColumn>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<HostedEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<Contact[]>([]);
  const [formData, setFormData] = useState({
    contactId: "",
    price: "",
    currency: "MXN",
    commissionType: "" as "" | "percentage" | "fixed",
    commissionValue: "",
    paymentStatus: "pending",
  });

  // Load clients when dialog opens
  useEffect(() => {
    if (editDialogOpen) {
      loadClients();
    }
  }, [editDialogOpen]);

  const loadClients = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('id, contact_name, contact_type, companies(name)')
      .eq('status', 'active')
      .order('contact_name');
    if (data) {
      setClients(data as Contact[]);
    }
  };

  const openEditDialog = (event: HostedEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setFormData({
      contactId: event.contact_id || "__none__",
      price: event.price?.toString() || "",
      currency: event.currency || "MXN",
      commissionType: (event.commission_type as "" | "percentage" | "fixed") || "",
      commissionValue: event.commission_value?.toString() || "",
      paymentStatus: event.payment_status || "pending",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!selectedEvent) return;

    try {
      setIsSaving(true);

      const priceValue = formData.price ? parseFloat(formData.price) : null;
      const commissionValue = formData.commissionValue ? parseFloat(formData.commissionValue) : null;
      const contactIdValue = formData.contactId === "__none__" ? null : formData.contactId;

      const { error } = await supabase
        .from("events")
        .update({
          contact_id: contactIdValue || null,
          price: priceValue,
          currency: formData.currency,
          commission_type: formData.commissionType || null,
          commission_value: commissionValue,
          payment_status: formData.paymentStatus,
        })
        .eq("id", selectedEvent.id);

      if (error) throw error;

      toast.success("Evento actualizado");
      setEditDialogOpen(false);
      setSelectedEvent(null);
      onEventUpdated?.();
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast.error("Error al actualizar evento");
    } finally {
      setIsSaving(false);
    }
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

  const toggleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const getEventStatus = (event: HostedEvent): 'draft' | 'closed' | 'active' => {
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

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Status filter
      if (statusFilter !== 'all' && getEventStatus(event) !== statusFilter) {
        return false;
      }

      // Payment filter
      if (paymentFilter !== 'all') {
        const eventPayment = event.payment_status || 'pending';
        if (eventPayment !== paymentFilter) {
          return false;
        }
      }

      // Date filter
      if (dateFilter !== 'all' && event.date) {
        const eventDate = parseLocalDate(event.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

        switch (dateFilter) {
          case 'upcoming':
            if (eventDate < today) return false;
            break;
          case 'this_month':
            if (eventDate < startOfMonth || eventDate > endOfMonth) return false;
            break;
          case 'next_month':
            if (eventDate < startOfNextMonth || eventDate > endOfNextMonth) return false;
            break;
          case 'past':
            if (eventDate >= today) return false;
            break;
        }
      } else if (dateFilter !== 'all' && !event.date) {
        // Events without date only show in 'all'
        return false;
      }

      return true;
    });
  }, [events, statusFilter, paymentFilter, dateFilter]);

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'name':
        return dir * a.name.localeCompare(b.name);
      case 'date':
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'created_at':
        return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'status':
        return dir * getEventStatus(a).localeCompare(getEventStatus(b));
      case 'guests':
        return dir * ((a.event_attendees?.[0]?.count || 0) - (b.event_attendees?.[0]?.count || 0));
      case 'client':
        const clientA = a.contacts?.contact_name || '';
        const clientB = b.contacts?.contact_name || '';
        return dir * clientA.localeCompare(clientB);
      case 'price':
        return dir * ((a.price || 0) - (b.price || 0));
      case 'payment':
        const paymentOrder = { paid: 0, partial: 1, pending: 2 };
        const paymentA = paymentOrder[a.payment_status as keyof typeof paymentOrder] ?? 2;
        const paymentB = paymentOrder[b.payment_status as keyof typeof paymentOrder] ?? 2;
        return dir * (paymentA - paymentB);
      default:
        return 0;
    }
  });

  const stats = {
    total: events.length,
    active: events.filter(e => getEventStatus(e) === 'active').length,
    draft: events.filter(e => getEventStatus(e) === 'draft').length,
    closed: events.filter(e => getEventStatus(e) === 'closed').length,
  };

  const hasActiveFilters = statusFilter !== 'all' || paymentFilter !== 'all' || dateFilter !== 'all';

  const clearFilters = () => {
    setStatusFilter('all');
    setPaymentFilter('all');
    setDateFilter('all');
  };

  const handleStatsCardClick = (status: StatusFilter) => {
    if (statusFilter === status) {
      setStatusFilter('all');
    } else {
      setStatusFilter(status);
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard value={stats.total} label="Total Eventos" />
        <StatsCard value={stats.active} label="Activos" />
        <StatsCard value={stats.draft} label="Borradores" />
        <StatsCard value={stats.closed} label="Cerrados" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filtros:</span>
        </div>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
            <SelectItem value="closed">Cerrados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as PaymentFilter)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="partial">Parcial</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fechas</SelectItem>
            <SelectItem value="upcoming">Próximos</SelectItem>
            <SelectItem value="this_month">Este mes</SelectItem>
            <SelectItem value="next_month">Próximo mes</SelectItem>
            <SelectItem value="past">Pasados</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}

        {hasActiveFilters && (
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredEvents.length} de {events.length} eventos
          </span>
        )}
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
          ) : events.length === 0 ? (
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
                    <SortableTableHeader column="name" label="Evento" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="client" label="Cliente" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="date" label="Fecha" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="created_at" label="Creado" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="status" label="Estado" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="guests" label="Invitados" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="price" label="Precio" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="payment" label="Pago" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <TableHead>Código</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEvents.map((event) => (
                    <TableRow
                      key={event.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/event/${event.id}`)}
                    >
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
                        {event.contacts?.contact_name ? (
                          <span
                            className="text-primary hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (event.contact_id) {
                                navigate(`/admin/client/${event.contact_id}`);
                              }
                            }}
                          >
                            {event.contacts.contact_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.date
                          ? format(parseLocalDate(event.date), "dd MMM yyyy", { locale: es })
                          : <span className="text-muted-foreground">Sin fecha</span>
                        }
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(event.created_at), "dd MMM yyyy", { locale: es })}
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
                        {event.price != null ? (
                          event.price === 0 ? (
                            <span className="text-muted-foreground">Gratis</span>
                          ) : (
                            <span className="font-medium">{formatCurrency(event.price, event.currency || 'MXN')}</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(event.payment_status || 'pending')}
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => openEditDialog(event, e)}
                            title="Editar información financiera"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {getEventStatus(event) === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/create-event?edit=${event.id}`)}
                            >
                              Completar
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

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Editar Evento</DialogTitle>
                <DialogDescription className="mt-1">
                  {selectedEvent?.name}
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
                value={formData.contactId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, contactId: value }))}
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

            {/* Current Payment Status */}
            {selectedEvent?.price && (
              <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado de pago:</span>
                {getPaymentStatusBadge(selectedEvent.payment_status || 'pending')}
              </div>
            )}

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
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Moneda</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
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
                value={formData.commissionType}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  commissionType: value as "" | "percentage" | "fixed",
                  commissionValue: value === "" ? "" : prev.commissionValue,
                }))}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="evt-commission-none" />
                  <label htmlFor="evt-commission-none" className="text-sm cursor-pointer">Sin comisión</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="evt-commission-percentage" />
                  <label htmlFor="evt-commission-percentage" className="text-sm cursor-pointer">Porcentaje</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="evt-commission-fixed" />
                  <label htmlFor="evt-commission-fixed" className="text-sm cursor-pointer">Monto fijo</label>
                </div>
              </RadioGroup>
            </div>

            {/* Commission Value */}
            {formData.commissionType && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {formData.commissionType === "percentage" ? "Porcentaje de Comisión" : "Monto de Comisión"}
                </Label>
                <div className="relative">
                  {formData.commissionType === "percentage" ? (
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  ) : (
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  )}
                  <Input
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

          <div className="flex gap-2 justify-end border-t pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSaving} className="h-11">
              Cancelar
            </Button>
            <Button onClick={handleSaveEvent} disabled={isSaving} className="h-11 px-6">
              {isSaving ? (
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
    </div>
  );
};
