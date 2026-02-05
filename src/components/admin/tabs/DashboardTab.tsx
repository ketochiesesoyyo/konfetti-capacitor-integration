import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "../shared/StatsCard";
import { SortableTableHeader } from "../shared/SortableTableHeader";
import { Calendar, DollarSign, Clock, TrendingUp, Users, ImageIcon, Copy, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseLocalDate } from "@/lib/utils";
import { toast } from "sonner";

interface Event {
  id: string;
  name: string;
  date: string;
  price: number | null;
  currency: string;
  payment_status: string;
  contact_id: string | null;
  contacts?: {
    contact_name: string;
  } | null;
  image_url?: string | null;
  invite_code?: string;
  status?: string;
  close_date?: string;
  event_attendees?: { count: number }[];
}

interface RevenueMetrics {
  totalRevenue: number;
  revenueThisMonth: number;
  pendingPayments: number;
  commissionsTotal: number;
}

interface DashboardTabProps {
  leadsCount: number;
  clientsCount: number;
  eventsCount: number;
  conversionRate: number;
  revenueMetrics: RevenueMetrics;
  upcomingEvents: Event[];
  currency: string;
}

type SortColumn = 'name' | 'date' | 'client' | 'price' | 'status' | 'guests' | 'payment';

const formatCurrency = (amount: number, currency: string) => {
  const symbols: Record<string, string> = {
    MXN: "$",
    USD: "$",
    INR: "₹",
  };
  return `${symbols[currency] || "$"}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

const getEventStatus = (event: Event): 'draft' | 'closed' | 'active' => {
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

export const DashboardTab = ({
  leadsCount,
  clientsCount,
  eventsCount,
  conversionRate,
  revenueMetrics,
  upcomingEvents,
  currency,
}: DashboardTabProps) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortColumn>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const sortedEvents = [...upcomingEvents].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'name':
        return dir * a.name.localeCompare(b.name);
      case 'date':
        return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'client':
        const clientA = a.contacts?.contact_name || '';
        const clientB = b.contacts?.contact_name || '';
        return dir * clientA.localeCompare(clientB);
      case 'price':
        return dir * ((a.price || 0) - (b.price || 0));
      case 'status':
        return dir * getEventStatus(a).localeCompare(getEventStatus(b));
      case 'guests':
        return dir * ((a.event_attendees?.[0]?.count || 0) - (b.event_attendees?.[0]?.count || 0));
      case 'payment':
        const paymentOrder = { paid: 0, partial: 1, pending: 2 };
        const paymentA = paymentOrder[a.payment_status as keyof typeof paymentOrder] ?? 2;
        const paymentB = paymentOrder[b.payment_status as keyof typeof paymentOrder] ?? 2;
        return dir * (paymentA - paymentB);
      default:
        return 0;
    }
  });

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  return (
    <div className="space-y-6">
      {/* CRM Stats Cards */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Estadísticas CRM</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard value={leadsCount} label="Leads Activos" valueColor="text-amber-500" />
          <StatsCard value={clientsCount} label="Total Clientes" valueColor="text-primary" />
          <StatsCard value={eventsCount} label="Total Eventos" valueColor="text-emerald-500" />
          <StatsCard
            value={`${conversionRate.toFixed(0)}%`}
            label="Tasa de Conversión"
            valueColor="text-purple-500"
          />
        </div>
      </div>

      {/* Revenue Stats Cards */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Métricas Financieras ({currency})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            value={formatCurrency(revenueMetrics.totalRevenue, currency)}
            label="Ingresos Totales"
            valueColor="text-emerald-600"
          />
          <StatsCard
            value={formatCurrency(revenueMetrics.revenueThisMonth, currency)}
            label="Ingresos Este Mes"
            valueColor="text-blue-600"
          />
          <StatsCard
            value={formatCurrency(revenueMetrics.pendingPayments, currency)}
            label="Pagos Pendientes"
            valueColor="text-amber-600"
          />
          <StatsCard
            value={formatCurrency(revenueMetrics.commissionsTotal, currency)}
            label="Comisiones Totales"
            valueColor="text-purple-600"
          />
        </div>
      </div>

      {/* Upcoming Events This Month */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Próximos Eventos Este Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHeader column="name" label="Evento" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="client" label="Cliente" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="date" label="Fecha" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
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
                        {format(parseLocalDate(event.date), "dd MMM yyyy", { locale: es })}
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
                        {event.price ? (
                          <span className="font-medium">{formatCurrency(event.price, event.currency || 'MXN')}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(event.payment_status || 'pending')}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {event.invite_code && getEventStatus(event) !== 'draft' && (
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                              {event.invite_code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(event.invite_code!, "Código copiado")}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/admin/event/${event.id}`)}
                          title="Ver detalles del evento"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No hay eventos programados para este mes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
