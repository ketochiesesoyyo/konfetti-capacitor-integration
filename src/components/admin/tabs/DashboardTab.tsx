import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "../shared/StatsCard";
import { SortableTableHeader } from "../shared/SortableTableHeader";
import { Calendar, DollarSign, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseLocalDate } from "@/lib/utils";

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

type SortColumn = 'name' | 'date' | 'client' | 'price' | 'status';

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
      return <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">Pagado</span>;
    case "partial":
      return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">Parcial</span>;
    default:
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">Pendiente</span>;
  }
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
        const statusOrder = { paid: 0, partial: 1, pending: 2 };
        const statusA = statusOrder[a.payment_status as keyof typeof statusOrder] ?? 2;
        const statusB = statusOrder[b.payment_status as keyof typeof statusOrder] ?? 2;
        return dir * (statusA - statusB);
      default:
        return 0;
    }
  });

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
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Próximos Eventos Este Mes
        </h3>
        {upcomingEvents.length > 0 ? (
          <div className="bg-card rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <SortableTableHeader
                      column="name"
                      label="Evento"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableTableHeader
                      column="date"
                      label="Fecha"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableTableHeader
                      column="client"
                      label="Cliente"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableTableHeader
                      column="price"
                      label="Precio"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableTableHeader
                      column="status"
                      label="Estado Pago"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onSort={toggleSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/admin/event/${event.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-medium">{event.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {format(parseLocalDate(event.date), "d 'de' MMMM", { locale: es })}
                      </td>
                      <td className="px-4 py-3 text-sm">
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
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {event.price ? formatCurrency(event.price, event.currency) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getPaymentStatusBadge(event.payment_status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg border p-8 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No hay eventos programados para este mes</p>
          </div>
        )}
      </div>
    </div>
  );
};
