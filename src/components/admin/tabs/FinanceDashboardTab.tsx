import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseLocalDate } from "@/lib/utils";
import { StatsCard } from "../shared/StatsCard";
import { SortableTableHeader } from "../shared/SortableTableHeader";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

interface FinanceDashboardTabProps {
  events: HostedEvent[];
  isLoading: boolean;
}

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

const PIE_COLORS = {
  paid: "#10b981",
  partial: "#f59e0b",
  pending: "#ef4444",
};

type TopClientSort = "rank" | "client" | "events" | "revenue" | "commissions" | "avgTicket";

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

const groupByCurrency = (
  events: HostedEvent[],
  filter: (e: HostedEvent) => boolean,
  getValue: (e: HostedEvent) => number
): Record<string, number> => {
  const result: Record<string, number> = {};
  events.filter(filter).forEach(e => {
    const cur = e.currency || 'MXN';
    result[cur] = (result[cur] || 0) + getValue(e);
  });
  return result;
};

export const FinanceDashboardTab = ({ events, isLoading }: FinanceDashboardTabProps) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<TopClientSort>("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const pricedEvents = useMemo(() => events.filter((e) => e.price && e.price > 0), [events]);

  // Currencies in use
  const currencies = useMemo(() => {
    const set = new Set<string>();
    pricedEvents.forEach(e => set.add(e.currency || 'MXN'));
    return Array.from(set).sort();
  }, [pricedEvents]);

  // ── KPI computations (per currency) ──

  const netRevenueByCurrency = useMemo(() => {
    const result: Record<string, number> = {};
    currencies.forEach(cur => {
      const curEvents = pricedEvents.filter(e => (e.currency || 'MXN') === cur);
      const paid = curEvents
        .filter(e => e.payment_status === "paid")
        .reduce((sum, e) => sum + (e.price || 0), 0);
      const comms = curEvents
        .filter(e => e.payment_status === "paid")
        .reduce((sum, e) => sum + getCommissionAmount(e), 0);
      result[cur] = paid - comms;
    });
    return result;
  }, [pricedEvents, currencies]);

  const avgTicketByCurrency = useMemo(() => {
    const result: Record<string, number> = {};
    currencies.forEach(cur => {
      const curEvents = pricedEvents.filter(e => (e.currency || 'MXN') === cur);
      const total = curEvents.reduce((sum, e) => sum + (e.price || 0), 0);
      result[cur] = curEvents.length > 0 ? total / curEvents.length : 0;
    });
    return result;
  }, [pricedEvents, currencies]);

  const revenuePerGuestByCurrency = useMemo(() => {
    const result: Record<string, number> = {};
    const totalAttendees = events.reduce((sum, e) => sum + (e.event_attendees?.[0]?.count || 0), 0);
    if (totalAttendees === 0) return result;
    currencies.forEach(cur => {
      const paid = pricedEvents
        .filter(e => (e.currency || 'MXN') === cur && e.payment_status === "paid")
        .reduce((sum, e) => sum + (e.price || 0), 0);
      if (paid > 0) result[cur] = paid / totalAttendees;
    });
    return result;
  }, [pricedEvents, events, currencies]);

  // Percentage KPIs (overall per currency)
  const effectiveMargin = useMemo(() => {
    let totalPaid = 0;
    let totalComms = 0;
    pricedEvents.filter(e => e.payment_status === "paid").forEach(e => {
      totalPaid += e.price || 0;
      totalComms += getCommissionAmount(e);
    });
    return totalPaid > 0 ? ((totalPaid - totalComms) / totalPaid) * 100 : 0;
  }, [pricedEvents]);

  const collectionRate = useMemo(() => {
    const totalBilled = pricedEvents.reduce((sum, e) => sum + (e.price || 0), 0);
    const totalPaid = pricedEvents
      .filter(e => e.payment_status === "paid")
      .reduce((sum, e) => sum + (e.price || 0), 0);
    return totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
  }, [pricedEvents]);

  // MoM growth (per currency)
  const momGrowth = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
    const prevYear = curMonth === 0 ? curYear - 1 : curYear;

    let curRev = 0;
    let prevRev = 0;

    pricedEvents.forEach((e) => {
      if (!e.date) return;
      const d = parseLocalDate(e.date);
      const m = d.getMonth();
      const y = d.getFullYear();
      if (m === curMonth && y === curYear) curRev += e.price || 0;
      if (m === prevMonth && y === prevYear) prevRev += e.price || 0;
    });

    if (prevRev === 0) return curRev > 0 ? 100 : 0;
    return ((curRev - prevRev) / prevRev) * 100;
  }, [pricedEvents]);

  // ── Monthly chart data (per currency) ──

  const monthlyChartDataByCurrency = useMemo(() => {
    const result: Record<string, { label: string; sortKey: string; cobrado: number; pendiente: number; comisiones: number }[]> = {};

    currencies.forEach(cur => {
      const months = new Map<
        string,
        { label: string; sortKey: string; cobrado: number; pendiente: number; comisiones: number }
      >();

      pricedEvents
        .filter(e => (e.currency || 'MXN') === cur)
        .forEach((event) => {
          if (!event.date) return;
          const d = parseLocalDate(event.date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = format(d, "MMM yy", { locale: es });
          const commission = getCommissionAmount(event);

          if (!months.has(key)) {
            months.set(key, { label, sortKey: key, cobrado: 0, pendiente: 0, comisiones: 0 });
          }

          const m = months.get(key)!;
          if (event.payment_status === "paid") {
            m.cobrado += event.price || 0;
          } else {
            m.pendiente += event.price || 0;
          }
          m.comisiones += commission;
        });

      result[cur] = Array.from(months.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    });

    return result;
  }, [pricedEvents, currencies]);

  // ── Pie chart data ──

  const pieData = useMemo(() => {
    let paid = 0;
    let partial = 0;
    let pending = 0;

    pricedEvents.forEach((e) => {
      if (e.payment_status === "paid") paid++;
      else if (e.payment_status === "partial") partial++;
      else pending++;
    });

    const segments = [];
    if (paid > 0) segments.push({ name: "Pagado", value: paid, color: PIE_COLORS.paid });
    if (partial > 0) segments.push({ name: "Parcial", value: partial, color: PIE_COLORS.partial });
    if (pending > 0) segments.push({ name: "Pendiente", value: pending, color: PIE_COLORS.pending });
    return segments;
  }, [pricedEvents]);

  // ── Top clients ──

  const topClients = useMemo(() => {
    const clientMap = new Map<
      string,
      {
        contactId: string;
        name: string;
        totalEvents: number;
        revenueByCurrency: Record<string, number>;
        commissionsByCurrency: Record<string, number>;
      }
    >();

    pricedEvents.forEach((e) => {
      const cid = e.contact_id || "__none__";
      const cname = e.contacts?.contact_name || "Sin cliente";
      const cur = e.currency || 'MXN';

      if (!clientMap.has(cid)) {
        clientMap.set(cid, { contactId: cid, name: cname, totalEvents: 0, revenueByCurrency: {}, commissionsByCurrency: {} });
      }

      const c = clientMap.get(cid)!;
      c.totalEvents++;
      c.revenueByCurrency[cur] = (c.revenueByCurrency[cur] || 0) + (e.price || 0);
      c.commissionsByCurrency[cur] = (c.commissionsByCurrency[cur] || 0) + getCommissionAmount(e);
    });

    // Sort by total revenue (sum of all currencies for ranking purposes)
    return Array.from(clientMap.values()).sort((a, b) => {
      const totalA = Object.values(a.revenueByCurrency).reduce((s, v) => s + v, 0);
      const totalB = Object.values(b.revenueByCurrency).reduce((s, v) => s + v, 0);
      return totalB - totalA;
    });
  }, [pricedEvents]);

  const toggleSort = (column: TopClientSort) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
  };

  const sortedClients = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const sumValues = (obj: Record<string, number>) => Object.values(obj).reduce((s, v) => s + v, 0);
    return [...topClients].sort((a, b) => {
      switch (sortBy) {
        case "client":
          return dir * a.name.localeCompare(b.name);
        case "events":
          return dir * (a.totalEvents - b.totalEvents);
        case "revenue":
          return dir * (sumValues(a.revenueByCurrency) - sumValues(b.revenueByCurrency));
        case "commissions":
          return dir * (sumValues(a.commissionsByCurrency) - sumValues(b.commissionsByCurrency));
        case "avgTicket": {
          const avgA = a.totalEvents > 0 ? sumValues(a.revenueByCurrency) / a.totalEvents : 0;
          const avgB = b.totalEvents > 0 ? sumValues(b.revenueByCurrency) / b.totalEvents : 0;
          return dir * (avgA - avgB);
        }
        default:
          return dir * (sumValues(a.revenueByCurrency) - sumValues(b.revenueByCurrency));
      }
    });
  }, [topClients, sortBy, sortDir]);

  // ── Data quality alerts ──

  const noPriceCount = useMemo(() => events.filter((e) => e.price === null || e.price === undefined).length, [events]);
  const noCommissionCount = useMemo(
    () => pricedEvents.filter((e) => !e.commission_type).length,
    [pricedEvents]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section A — KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard value={<MultiCurrencyDisplay amounts={netRevenueByCurrency} />} label="Ingreso Neto" valueColor="text-emerald-600" />
        <StatsCard value={`${effectiveMargin.toFixed(1)}%`} label="Margen Efectivo" valueColor="text-blue-600" />
        <StatsCard value={`${collectionRate.toFixed(1)}%`} label="Tasa de Cobro" valueColor="text-purple-600" />
        <StatsCard value={<MultiCurrencyDisplay amounts={avgTicketByCurrency} />} label="Ticket Promedio" valueColor="text-teal-600" />
        <StatsCard value={<MultiCurrencyDisplay amounts={revenuePerGuestByCurrency} />} label="Ingreso por Invitado" valueColor="text-indigo-600" />
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1">
              <span className={`text-2xl font-bold ${momGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {momGrowth >= 0 ? "+" : ""}
                {momGrowth.toFixed(1)}%
              </span>
              {momGrowth >= 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">Crecimiento MoM</p>
          </CardContent>
        </Card>
      </div>

      {/* Section B — Monthly Revenue Chart (per currency) */}
      {currencies.map(cur => {
        const chartData = monthlyChartDataByCurrency[cur] || [];
        if (chartData.length === 0) return null;
        const symbol = ({ MXN: "$", USD: "$", INR: "\u20B9" } as Record<string, string>)[cur] || "$";
        return (
          <Card key={cur}>
            <CardHeader>
              <CardTitle>Ingresos Mensuales {currencies.length > 1 ? `(${cur})` : ""}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${symbol}${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, cur)} />
                  <Legend />
                  <Bar dataKey="cobrado" name="Cobrado" stackId="revenue" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pendiente" name="Pendiente" stackId="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Line
                    dataKey="comisiones"
                    name="Comisiones"
                    type="monotone"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })}

      {/* Section C — Payment Status Pie Chart */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estado de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section D — Top Clients Table */}
      {sortedClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Clientes por Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <SortableTableHeader column="client" label="Cliente" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="events" label="Eventos" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="revenue" label="Ingresos Totales" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="commissions" label="Comisiones" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="avgTicket" label="Ticket Promedio" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedClients.map((client, index) => {
                    const avgByCurrency: Record<string, number> = {};
                    Object.entries(client.revenueByCurrency).forEach(([cur, rev]) => {
                      avgByCurrency[cur] = client.totalEvents > 0 ? rev / client.totalEvents : 0;
                    });
                    return (
                      <TableRow key={client.contactId}>
                        <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          {client.contactId !== "__none__" ? (
                            <span
                              className="text-primary hover:underline cursor-pointer font-medium"
                              onClick={() => navigate(`/admin/client/${client.contactId}`)}
                            >
                              {client.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{client.name}</span>
                          )}
                        </TableCell>
                        <TableCell>{client.totalEvents}</TableCell>
                        <TableCell className="font-medium">
                          <MultiCurrencyDisplay amounts={client.revenueByCurrency} />
                        </TableCell>
                        <TableCell>
                          <MultiCurrencyDisplay amounts={client.commissionsByCurrency} />
                        </TableCell>
                        <TableCell>
                          <MultiCurrencyDisplay amounts={avgByCurrency} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section E — Data Quality Alerts */}
      {(noPriceCount > 0 || noCommissionCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {noPriceCount > 0 && (
            <Card className="border-amber-500/30">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    {noPriceCount} evento{noPriceCount !== 1 ? "s" : ""} sin precio asignado
                  </p>
                  <p className="text-sm text-muted-foreground">Asigna un precio para incluirlos en el análisis</p>
                </div>
              </CardContent>
            </Card>
          )}
          {noCommissionCount > 0 && (
            <Card className="border-amber-500/30">
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    {noCommissionCount} evento{noCommissionCount !== 1 ? "s" : ""} sin comisión definida
                  </p>
                  <p className="text-sm text-muted-foreground">Define el tipo de comisión para un análisis completo</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
