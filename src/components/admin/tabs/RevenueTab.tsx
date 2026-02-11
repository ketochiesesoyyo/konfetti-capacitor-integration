import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, Clock, CheckCircle, ImageIcon, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseLocalDate } from "@/lib/utils";
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

interface RevenueTabProps {
  events: HostedEvent[];
  isLoading: boolean;
}

type SortColumn = 'name' | 'client' | 'date' | 'price' | 'commission' | 'payment';
const formatCurrency = (amount: number, currency: string = "MXN") => {
  const symbols: Record<string, string> = { MXN: "$", USD: "$", INR: "₹" };
  return `${symbols[currency] || "$"}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getCommissionAmount = (event: HostedEvent): number => {
  if (!event.commission_type || !event.commission_value || !event.price) return 0;
  if (event.commission_type === "percentage") {
    return event.price * event.commission_value / 100;
  }
  return event.commission_value;
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

const MultiCurrencyDisplay = ({ amounts }: { amounts: Record<string, number> }) => {
  const entries = Object.entries(amounts).filter(([_, v]) => v > 0);
  if (entries.length === 0) return <>$0.00</>;
  if (entries.length === 1) {
    const [cur, amt] = entries[0];
    return <>{formatCurrency(amt, cur)} <span className="text-sm font-normal text-muted-foreground">{cur}</span></>;
  }
  return (
    <div className="space-y-0.5">
      {entries.map(([cur, amt]) => (
        <div key={cur} className="flex items-baseline gap-1">
          <span className="text-lg">{formatCurrency(amt, cur)}</span>
          <span className="text-xs font-normal text-muted-foreground">{cur}</span>
        </div>
      ))}
    </div>
  );
};

export const RevenueTab = ({ events, isLoading }: RevenueTabProps) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortColumn>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Only events with a price (excludes free/unpriced)
  const pricedEvents = useMemo(() => events.filter(e => e.price && e.price > 0), [events]);

  // Stats grouped by currency
  const totalRevenueByCurrency = useMemo(() => {
    const result: Record<string, number> = {};
    pricedEvents
      .filter(e => e.payment_status === 'paid')
      .forEach(e => {
        const cur = e.currency || 'MXN';
        result[cur] = (result[cur] || 0) + (e.price || 0);
      });
    return result;
  }, [pricedEvents]);

  const totalCommissionsPaidByCurrency = useMemo(() => {
    const result: Record<string, number> = {};
    pricedEvents
      .filter(e => e.payment_status === 'paid')
      .forEach(e => {
        const cur = e.currency || 'MXN';
        result[cur] = (result[cur] || 0) + getCommissionAmount(e);
      });
    return result;
  }, [pricedEvents]);

  const totalCommissionsPendingByCurrency = useMemo(() => {
    const result: Record<string, number> = {};
    pricedEvents
      .filter(e => e.payment_status === 'pending' || e.payment_status === 'partial')
      .forEach(e => {
        const cur = e.currency || 'MXN';
        result[cur] = (result[cur] || 0) + getCommissionAmount(e);
      });
    return result;
  }, [pricedEvents]);

  const paidCount = useMemo(() =>
    pricedEvents.filter(e => e.payment_status === 'paid').length,
    [pricedEvents]
  );

  // Sort
  const toggleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const sortedEvents = useMemo(() => {
    return [...pricedEvents].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'client':
          return dir * (a.contacts?.contact_name || '').localeCompare(b.contacts?.contact_name || '');
        case 'date':
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
        case 'price':
          return dir * ((a.price || 0) - (b.price || 0));
        case 'commission':
          return dir * (getCommissionAmount(a) - getCommissionAmount(b));
        case 'payment': {
          const order = { paid: 0, partial: 1, pending: 2 };
          return dir * ((order[a.payment_status as keyof typeof order] ?? 2) - (order[b.payment_status as keyof typeof order] ?? 2));
        }
        default:
          return 0;
      }
    });
  }, [pricedEvents, sortBy, sortDir]);

  // Monthly breakdown grouped by month + currency
  const monthlyBreakdown = useMemo(() => {
    const buckets = new Map<string, {
      label: string;
      sortKey: string;
      currency: string;
      eventCount: number;
      totalPrice: number;
      totalCommissions: number;
      paidAmount: number;
      pendingAmount: number;
    }>();

    pricedEvents.forEach(event => {
      if (!event.date) return;
      const d = parseLocalDate(event.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cur = event.currency || 'MXN';
      const key = `${monthKey}-${cur}`;
      const label = format(d, "MMMM yyyy", { locale: es });
      const commission = getCommissionAmount(event);

      if (!buckets.has(key)) {
        buckets.set(key, {
          label: label.charAt(0).toUpperCase() + label.slice(1),
          sortKey: key,
          currency: cur,
          eventCount: 0,
          totalPrice: 0,
          totalCommissions: 0,
          paidAmount: 0,
          pendingAmount: 0,
        });
      }

      const m = buckets.get(key)!;
      m.eventCount++;
      m.totalPrice += event.price || 0;
      m.totalCommissions += commission;
      if (event.payment_status === 'paid') {
        m.paidAmount += event.price || 0;
      } else {
        m.pendingAmount += event.price || 0;
      }
    });

    return Array.from(buckets.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [pricedEvents]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          value={<MultiCurrencyDisplay amounts={totalRevenueByCurrency} />}
          label="Total Ingresos"
          valueColor="text-emerald-600"
        />
        <StatsCard
          value={<MultiCurrencyDisplay amounts={totalCommissionsPaidByCurrency} />}
          label="Comisiones Pagadas"
          valueColor="text-blue-600"
        />
        <StatsCard
          value={<MultiCurrencyDisplay amounts={totalCommissionsPendingByCurrency} />}
          label="Comisiones Pendientes"
          valueColor="text-amber-600"
        />
        <StatsCard
          value={`${paidCount} / ${pricedEvents.length}`}
          label="Eventos Pagados"
          valueColor="text-purple-600"
        />
      </div>

      {/* Financial Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Eventos Financieros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pricedEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay eventos con precio asignado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHeader column="name" label="Evento" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="client" label="Cliente" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="date" label="Fecha" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="price" label="Precio" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="commission" label="Comisión" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="payment" label="Estado Pago" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEvents.map((event) => {
                    const commission = getCommissionAmount(event);
                    return (
                      <TableRow
                        key={event.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/event/${event.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                              {event.image_url ? (
                                <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
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
                                if (event.contact_id) navigate(`/admin/client/${event.contact_id}`);
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
                        <TableCell>
                          <span className="font-medium">{formatCurrency(event.price || 0, event.currency || 'MXN')}</span>
                          <span className="text-xs text-muted-foreground ml-1">{event.currency || 'MXN'}</span>
                        </TableCell>
                        <TableCell>
                          {commission > 0 ? (
                            <div>
                              <span className="font-medium">{formatCurrency(commission, event.currency || 'MXN')}</span>
                              {event.commission_type === 'percentage' && (
                                <span className="text-xs text-muted-foreground ml-1">({event.commission_value}%)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(event.payment_status || 'pending')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      {monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Desglose Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-center">Moneda</TableHead>
                    <TableHead className="text-right">Eventos</TableHead>
                    <TableHead className="text-right">Total Precio</TableHead>
                    <TableHead className="text-right">Comisiones</TableHead>
                    <TableHead className="text-right">Cobrado</TableHead>
                    <TableHead className="text-right">Pendiente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyBreakdown.map((month) => (
                    <TableRow key={month.sortKey}>
                      <TableCell className="font-medium">{month.label}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">{month.currency}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{month.eventCount}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(month.totalPrice, month.currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(month.totalCommissions, month.currency)}</TableCell>
                      <TableCell className="text-right text-emerald-600">{formatCurrency(month.paidAmount, month.currency)}</TableCell>
                      <TableCell className="text-right text-amber-600">{formatCurrency(month.pendingAmount, month.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
