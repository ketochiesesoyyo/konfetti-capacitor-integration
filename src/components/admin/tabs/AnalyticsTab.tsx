import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Building2, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
  ReferenceLine,
} from "recharts";

// Reuse types from AdminContent
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

interface AnalyticsTabProps {
  events: HostedEvent[];
  clients: Contact[];
  isLoading: boolean;
}

type CohortView = "bodas" | "ingresos" | "retencion";

const formatCurrency = (amount: number, currency: string = "MXN") => {
  const symbols: Record<string, string> = { MXN: "$", USD: "$", INR: "₹" };
  return `${symbols[currency] || "$"}${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const AnalyticsTab = ({ events, clients, isLoading }: AnalyticsTabProps) => {
  const [cohortView, setCohortView] = useState<CohortView>("bodas");

  // === Data Joining ===
  const { contactToCompanyMap, companyEvents, companyOnboardingMonth, companyNames } = useMemo(() => {
    // Map contact IDs to their company info
    const ctcMap = new Map<string, { companyId: string; companyName: string }>();
    const companyNameMap = new Map<string, string>();

    clients.forEach((c) => {
      if (c.company_id && c.companies?.name) {
        ctcMap.set(c.id, { companyId: c.company_id, companyName: c.companies.name });
        companyNameMap.set(c.company_id, c.companies.name);
      }
    });

    // Group events by company
    const compEvts = new Map<string, HostedEvent[]>();
    events.forEach((evt) => {
      if (!evt.contact_id) return;
      const company = ctcMap.get(evt.contact_id);
      if (!company) return;
      const existing = compEvts.get(company.companyId) || [];
      existing.push(evt);
      compEvts.set(company.companyId, existing);
    });

    // Determine onboarding month per company (earliest contact created_at)
    const onboardingMap = new Map<string, Date>();
    clients.forEach((c) => {
      if (!c.company_id) return;
      const date = new Date(c.created_at);
      const existing = onboardingMap.get(c.company_id);
      if (!existing || date < existing) {
        onboardingMap.set(c.company_id, date);
      }
    });

    return {
      contactToCompanyMap: ctcMap,
      companyEvents: compEvts,
      companyOnboardingMonth: onboardingMap,
      companyNames: companyNameMap,
    };
  }, [events, clients]);

  // === KPI: Active Companies ===
  const activeCompaniesCount = useMemo(() => {
    return companyEvents.size;
  }, [companyEvents]);

  // === KPI: Revenue per Company (for concentration + NRR) ===
  const companyRevenue = useMemo(() => {
    const result = new Map<string, number>();
    companyEvents.forEach((evts, companyId) => {
      const revenue = evts
        .filter((e) => e.payment_status === "paid" && e.price)
        .reduce((sum, e) => sum + (e.price || 0), 0);
      if (revenue > 0) {
        result.set(companyId, revenue);
      }
    });
    return result;
  }, [companyEvents]);

  const totalRevenue = useMemo(() => {
    let sum = 0;
    companyRevenue.forEach((v) => (sum += v));
    return sum;
  }, [companyRevenue]);

  // === KPI: NRR ===
  const nrrData = useMemo(() => {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
    const thirteenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 13, 1);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const pastMonthEnd = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + 1, 0);

    // Companies that existed 12 months ago
    const eligibleCompanies: string[] = [];
    companyOnboardingMonth.forEach((onboardDate, companyId) => {
      if (onboardDate < twelveMonthsAgo) {
        eligibleCompanies.push(companyId);
      }
    });

    if (eligibleCompanies.length === 0) {
      // Try 6-month fallback
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, 1);
      const pastMonthEnd6 = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + 1, 0);

      const eligible6: string[] = [];
      companyOnboardingMonth.forEach((onboardDate, companyId) => {
        if (onboardDate < sixMonthsAgo) {
          eligible6.push(companyId);
        }
      });

      if (eligible6.length === 0) {
        return { nrr: null, label: "N/A", subtitle: "Necesita más datos históricos", months: 0 };
      }

      const pastRevenue = getRevenueInPeriod(eligible6, sevenMonthsAgo, pastMonthEnd6);
      const currentRevenuePeriod = getRevenueInPeriod(eligible6, currentMonthStart, currentMonthEnd);

      if (pastRevenue === 0) {
        return { nrr: null, label: "N/A", subtitle: "Sin ingresos en periodo base (6m)", months: 6 };
      }

      const nrr = (currentRevenuePeriod / pastRevenue) * 100;
      return { nrr, label: `${nrr.toFixed(0)}%`, subtitle: "NRR a 6 meses (datos insuficientes para 12m)", months: 6 };
    }

    const pastRevenue = getRevenueInPeriod(eligibleCompanies, thirteenMonthsAgo, pastMonthEnd);
    const currentRevenuePeriod = getRevenueInPeriod(eligibleCompanies, currentMonthStart, currentMonthEnd);

    if (pastRevenue === 0) {
      return { nrr: null, label: "N/A", subtitle: "Sin ingresos en periodo base", months: 12 };
    }

    const nrr = (currentRevenuePeriod / pastRevenue) * 100;
    return { nrr, label: `${nrr.toFixed(0)}%`, subtitle: "Retención neta de ingresos (12m)", months: 12 };
  }, [companyEvents, companyOnboardingMonth]);

  function getRevenueInPeriod(companyIds: string[], start: Date, end: Date): number {
    let total = 0;
    companyIds.forEach((companyId) => {
      const evts = companyEvents.get(companyId) || [];
      evts.forEach((e) => {
        if (e.payment_status !== "paid" || !e.price || !e.date) return;
        const d = new Date(e.date);
        if (d >= start && d <= end) {
          total += e.price;
        }
      });
    });
    return total;
  }

  // === KPI: Revenue Concentration ===
  const concentrationData = useMemo(() => {
    if (companyRevenue.size === 0) {
      return { topPct: 0, topCompanyName: "—", level: "green" as const };
    }

    let topCompanyId = "";
    let topAmount = 0;
    companyRevenue.forEach((revenue, companyId) => {
      if (revenue > topAmount) {
        topAmount = revenue;
        topCompanyId = companyId;
      }
    });

    const topPct = totalRevenue > 0 ? (topAmount / totalRevenue) * 100 : 0;
    const topCompanyName = companyNames.get(topCompanyId) || "Desconocida";
    const level = topPct > 50 ? "red" : topPct > 30 ? "amber" : "green";

    return { topPct, topCompanyName, level } as const;
  }, [companyRevenue, totalRevenue, companyNames]);

  // === Cohort Table Data ===
  const cohortData = useMemo(() => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Group companies by onboarding month
    const cohorts = new Map<string, { companies: string[]; label: string; date: Date }>();

    companyOnboardingMonth.forEach((onboardDate, companyId) => {
      const key = `${onboardDate.getFullYear()}-${String(onboardDate.getMonth() + 1).padStart(2, "0")}`;
      if (!cohorts.has(key)) {
        cohorts.set(key, {
          companies: [],
          label: format(onboardDate, "MMM yyyy", { locale: es }),
          date: new Date(onboardDate.getFullYear(), onboardDate.getMonth(), 1),
        });
      }
      cohorts.get(key)!.companies.push(companyId);
    });

    // Sort by date ascending
    const sortedCohorts = Array.from(cohorts.entries())
      .sort(([, a], [, b]) => a.date.getTime() - b.date.getTime());

    // Calculate max months from earliest cohort to now
    const maxRelativeMonths = 12;

    return sortedCohorts.map(([key, cohort]) => {
      const monthsSinceOnboarding = Math.floor(
        (currentMonth.getTime() - cohort.date.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      );
      const monthsToShow = Math.min(monthsSinceOnboarding + 1, maxRelativeMonths);

      // Total revenue for this cohort
      let cohortTotalRevenue = 0;
      cohort.companies.forEach((cId) => {
        cohortTotalRevenue += companyRevenue.get(cId) || 0;
      });

      // Per-month data
      const months: Array<{ bodas: number; ingresos: number; retencion: number }> = [];

      for (let m = 0; m < monthsToShow; m++) {
        const monthStart = new Date(cohort.date.getFullYear(), cohort.date.getMonth() + m, 1);
        const monthEnd = new Date(cohort.date.getFullYear(), cohort.date.getMonth() + m + 1, 0);

        if (monthStart > currentMonth) break;

        let bodas = 0;
        let ingresos = 0;
        const companiesActive = new Set<string>();

        cohort.companies.forEach((companyId) => {
          const evts = companyEvents.get(companyId) || [];
          evts.forEach((e) => {
            if (!e.date) return;
            const d = new Date(e.date);
            if (d >= monthStart && d <= monthEnd) {
              bodas++;
              if (e.payment_status === "paid" && e.price) {
                ingresos += e.price;
              }
              companiesActive.add(companyId);
            }
          });
        });

        const retencion = cohort.companies.length > 0
          ? (companiesActive.size / cohort.companies.length) * 100
          : 0;

        months.push({ bodas, ingresos, retencion });
      }

      // Churn detection: last 3 months with no events across any company in cohort
      let hasRecentActivity = false;
      for (let m = Math.max(0, months.length - 3); m < months.length; m++) {
        if (months[m].bodas > 0) hasRecentActivity = true;
      }
      const isChurned = months.length >= 3 && !hasRecentActivity;

      return {
        key,
        label: cohort.label,
        companiesCount: cohort.companies.length,
        totalRevenue: cohortTotalRevenue,
        months,
        isChurned,
      };
    });
  }, [companyOnboardingMonth, companyEvents, companyRevenue]);

  // === Pareto Chart Data ===
  const paretoData = useMemo(() => {
    const sorted = Array.from(companyRevenue.entries())
      .map(([companyId, revenue]) => ({
        name: companyNames.get(companyId) || "Desconocida",
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    let cumulative = 0;
    return sorted.map((item) => {
      cumulative += item.revenue;
      return {
        ...item,
        cumulativePct: totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 0,
        name: item.name.length > 15 ? item.name.slice(0, 15) + "..." : item.name,
      };
    });
  }, [companyRevenue, companyNames, totalRevenue]);

  // === Dependency Alert ===
  const dependencyAlerts = useMemo(() => {
    const alerts: Array<{ companyName: string; pct: number; level: "amber" | "red" }> = [];
    companyRevenue.forEach((revenue, companyId) => {
      const pct = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
      if (pct > 50) {
        alerts.push({ companyName: companyNames.get(companyId) || "Desconocida", pct, level: "red" });
      } else if (pct > 30) {
        alerts.push({ companyName: companyNames.get(companyId) || "Desconocida", pct, level: "amber" });
      }
    });
    return alerts.sort((a, b) => b.pct - a.pct);
  }, [companyRevenue, totalRevenue, companyNames]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getRetentionColor = (pct: number) => {
    if (pct === 0) return "text-gray-400 bg-gray-500/10";
    if (pct >= 80) return "text-emerald-700 bg-emerald-500/15 dark:text-emerald-400";
    if (pct >= 50) return "text-amber-700 bg-amber-500/15 dark:text-amber-400";
    return "text-red-700 bg-red-500/15 dark:text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Section A: KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Active Companies */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Empresas Activas</p>
            </div>
            <div className="text-3xl font-bold">{activeCompaniesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Con al menos 1 evento asignado</p>
          </CardContent>
        </Card>

        {/* Card 2: NRR */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">NRR</p>
            </div>
            <div className={cn(
              "text-3xl font-bold",
              nrrData.nrr !== null
                ? nrrData.nrr >= 100
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
                : "text-muted-foreground"
            )}>
              {nrrData.label}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{nrrData.subtitle}</p>
          </CardContent>
        </Card>

        {/* Card 3: Revenue Concentration */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Concentración de Ingresos</p>
            </div>
            <div className={cn(
              "text-3xl font-bold",
              concentrationData.level === "red" ? "text-red-600 dark:text-red-400" :
              concentrationData.level === "amber" ? "text-amber-600 dark:text-amber-400" :
              "text-emerald-600 dark:text-emerald-400"
            )}>
              {concentrationData.topPct.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Top empresa: {concentrationData.topCompanyName}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section B: Cohort Retention Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tabla de Cohortes</CardTitle>
            <div className="flex gap-1">
              {(["bodas", "ingresos", "retencion"] as CohortView[]).map((view) => (
                <Button
                  key={view}
                  variant={cohortView === view ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCohortView(view)}
                >
                  {view === "bodas" ? "Bodas" : view === "ingresos" ? "Ingresos" : "Retención %"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {cohortData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay datos de cohortes disponibles. Se necesitan empresas con eventos asignados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Cohorte</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Empresas</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Ingresos Tot.</TableHead>
                    {Array.from({ length: Math.min(12, Math.max(...cohortData.map((c) => c.months.length), 0)) }).map((_, i) => (
                      <TableHead key={i} className="text-center whitespace-nowrap">
                        M{i + 1}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohortData.map((cohort) => (
                    <TableRow
                      key={cohort.key}
                      className={cn(cohort.isChurned && "opacity-60")}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {cohort.label}
                          {cohort.isChurned && (
                            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/30">
                              Inactivo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{cohort.companiesCount}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatCurrency(cohort.totalRevenue)}
                      </TableCell>
                      {Array.from({ length: Math.min(12, Math.max(...cohortData.map((c) => c.months.length), 0)) }).map((_, i) => {
                        if (i >= cohort.months.length) {
                          return <TableCell key={i} className="text-center text-muted-foreground">—</TableCell>;
                        }
                        const monthData = cohort.months[i];
                        if (cohortView === "bodas") {
                          return (
                            <TableCell key={i} className="text-center">
                              {monthData.bodas || <span className="text-muted-foreground">0</span>}
                            </TableCell>
                          );
                        }
                        if (cohortView === "ingresos") {
                          return (
                            <TableCell key={i} className="text-center whitespace-nowrap text-sm">
                              {monthData.ingresos > 0
                                ? formatCurrency(monthData.ingresos)
                                : <span className="text-muted-foreground">$0</span>}
                            </TableCell>
                          );
                        }
                        // Retention %
                        return (
                          <TableCell key={i} className="text-center p-1">
                            <span className={cn(
                              "inline-block px-2 py-0.5 rounded text-xs font-medium",
                              getRetentionColor(monthData.retencion)
                            )}>
                              {monthData.retencion.toFixed(0)}%
                            </span>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section C: Revenue Concentration Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Concentración de Ingresos (Pareto)</CardTitle>
        </CardHeader>
        <CardContent>
          {paretoData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay datos de ingresos por empresa disponibles.
            </p>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    yAxisId="revenue"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <YAxis
                    yAxisId="pct"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "revenue") return [formatCurrency(value), "Ingresos"];
                      return [`${value.toFixed(1)}%`, "Acumulado"];
                    }}
                    labelFormatter={(label) => `Empresa: ${label}`}
                  />
                  <Legend
                    formatter={(value) => value === "revenue" ? "Ingresos" : "% Acumulado"}
                  />
                  <ReferenceLine
                    yAxisId="pct"
                    y={80}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="5 5"
                    label={{ value: "80%", position: "right", fontSize: 11 }}
                  />
                  <Bar
                    yAxisId="revenue"
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                  />
                  <Line
                    yAxisId="pct"
                    dataKey="cumulativePct"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dependency Alerts */}
      {dependencyAlerts.length > 0 && (
        <div className="space-y-3">
          {dependencyAlerts.map((alert) => (
            <Card
              key={alert.companyName}
              className={cn(
                "border",
                alert.level === "red"
                  ? "border-red-500/40 bg-red-500/5"
                  : "border-amber-500/40 bg-amber-500/5"
              )}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={cn(
                    "h-5 w-5 flex-shrink-0",
                    alert.level === "red" ? "text-red-500" : "text-amber-500"
                  )} />
                  <p className={cn(
                    "text-sm font-medium",
                    alert.level === "red"
                      ? "text-red-700 dark:text-red-400"
                      : "text-amber-700 dark:text-amber-400"
                  )}>
                    {alert.companyName} representa el {alert.pct.toFixed(1)}% de tus ingresos totales
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
