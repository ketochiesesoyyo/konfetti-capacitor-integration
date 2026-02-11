import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  AlertTriangle,
  ShieldBan,
  ShieldCheck,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Mail,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatsCard } from "../shared/StatsCard";
import { SortableTableHeader } from "../shared/SortableTableHeader";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  photos: string[] | null;
  gender: string | null;
  age: number | null;
  created_at: string;
  bio: string | null;
  is_banned: boolean | null;
  banned_at: string | null;
  ban_reason: string | null;
}

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  custom_reason: string | null;
  event_id: string;
  created_at: string;
  reporter?: { name: string } | null;
  reported?: { name: string } | null;
  events?: { name: string } | null;
}

interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason: string | null;
  event_id: string | null;
  created_at: string;
  blocker?: { name: string } | null;
  blocked?: { name: string } | null;
  events?: { name: string } | null;
}

interface UserWithStats extends UserProfile {
  eventsCount: number;
  reportsReceived: number;
  blocksReceived: number;
}

type SortColumn = "name" | "gender" | "age" | "created_at" | "events" | "reports" | "blocks";
type GenderFilter = "all" | "male" | "female" | "other";
type StatusFilter = "all" | "active" | "banned";
type FlaggedFilter = "all" | "flagged" | "clean";
type RegistrationFilter = "all" | "this_month" | "last_3_months" | "last_6_months";

export const UsersTab = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortColumn>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Filters
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [flaggedFilter, setFlaggedFilter] = useState<FlaggedFilter>("all");
  const [registrationFilter, setRegistrationFilter] = useState<RegistrationFilter>("all");

  // Ban dialog
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [isBanning, setIsBanning] = useState(false);

  // Email dialog
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<UserWithStats | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Detail dialog
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [userEvents, setUserEvents] = useState<
    { event_id: string; joined_at: string; events: { name: string; date: string } | null }[]
  >([]);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [userBlocks, setUserBlocks] = useState<Block[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadUsers(), loadReports(), loadBlocks()]);
    setIsLoading(false);
  };

  const loadUsers = async () => {
    // Load profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, name, photos, gender, age, created_at, bio, is_banned, banned_at, ban_reason")
      .order("created_at", { ascending: false });

    // Load event attendance counts
    const { data: attendees } = await supabase
      .from("event_attendees")
      .select("user_id");

    // Load reports received counts
    const { data: reportsData } = await supabase
      .from("reports")
      .select("reported_user_id");

    // Load blocks received counts
    const { data: blocksData } = await supabase
      .from("blocked_users")
      .select("blocked_id");

    // Count per user
    const eventCounts: Record<string, number> = {};
    attendees?.forEach((a) => {
      eventCounts[a.user_id] = (eventCounts[a.user_id] || 0) + 1;
    });

    const reportCounts: Record<string, number> = {};
    reportsData?.forEach((r) => {
      reportCounts[r.reported_user_id] =
        (reportCounts[r.reported_user_id] || 0) + 1;
    });

    const blockCounts: Record<string, number> = {};
    blocksData?.forEach((b) => {
      blockCounts[b.blocked_id] = (blockCounts[b.blocked_id] || 0) + 1;
    });

    const usersWithStats: UserWithStats[] = (profiles || []).map((p) => ({
      ...p,
      eventsCount: eventCounts[p.user_id] || 0,
      reportsReceived: reportCounts[p.user_id] || 0,
      blocksReceived: blockCounts[p.user_id] || 0,
    }));

    setUsers(usersWithStats);
  };

  const loadReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select(
        "*, reporter:profiles!reports_reporter_id_fkey(name), reported:profiles!reports_reported_user_id_fkey(name), events(name)"
      )
      .order("created_at", { ascending: false });
    setReports((data as Report[]) || []);
  };

  const loadBlocks = async () => {
    const { data } = await supabase
      .from("blocked_users")
      .select(
        "*, blocker:profiles!blocked_users_blocker_id_fkey(name), blocked:profiles!blocked_users_blocked_id_fkey(name), events(name)"
      )
      .order("created_at", { ascending: false });
    setBlocks((data as Block[]) || []);
  };

  const openUserDetail = async (user: UserWithStats) => {
    setSelectedUser(user);
    setDetailOpen(true);

    // Load user's events
    const { data: events } = await supabase
      .from("event_attendees")
      .select("event_id, joined_at, events(name, date)")
      .eq("user_id", user.user_id)
      .order("joined_at", { ascending: false });
    setUserEvents(events as typeof userEvents || []);

    // Load user's reports (received)
    const { data: reps } = await supabase
      .from("reports")
      .select(
        "*, reporter:profiles!reports_reporter_id_fkey(name), events(name)"
      )
      .eq("reported_user_id", user.user_id)
      .order("created_at", { ascending: false });
    setUserReports((reps as Report[]) || []);

    // Load user's blocks (received)
    const { data: blks } = await supabase
      .from("blocked_users")
      .select(
        "*, blocker:profiles!blocked_users_blocker_id_fkey(name), events(name)"
      )
      .eq("blocked_id", user.user_id)
      .order("created_at", { ascending: false });
    setUserBlocks((blks as Block[]) || []);
  };

  const toggleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  // Unique active users this month
  const mau = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return users.filter((u) => new Date(u.created_at) >= startOfMonth).length;
  }, [users]);

  const hasActiveFilters = genderFilter !== "all" || statusFilter !== "all" || flaggedFilter !== "all" || registrationFilter !== "all";

  const clearFilters = () => {
    setGenderFilter("all");
    setStatusFilter("all");
    setFlaggedFilter("all");
    setRegistrationFilter("all");
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Search
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter((u) => u.name.toLowerCase().includes(s));
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((u) => !u.is_banned);
    } else if (statusFilter === "banned") {
      filtered = filtered.filter((u) => u.is_banned);
    }

    // Gender filter
    if (genderFilter !== "all") {
      if (genderFilter === "other") {
        filtered = filtered.filter((u) => u.gender !== "male" && u.gender !== "female");
      } else {
        filtered = filtered.filter((u) => u.gender === genderFilter);
      }
    }

    // Flagged filter
    if (flaggedFilter === "flagged") {
      filtered = filtered.filter((u) => u.reportsReceived > 0 || u.blocksReceived > 0);
    } else if (flaggedFilter === "clean") {
      filtered = filtered.filter((u) => u.reportsReceived === 0 && u.blocksReceived === 0);
    }

    // Registration date filter
    if (registrationFilter !== "all") {
      const now = new Date();
      let cutoff: Date;
      switch (registrationFilter) {
        case "this_month":
          cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "last_3_months":
          cutoff = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case "last_6_months":
          cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          break;
      }
      filtered = filtered.filter((u) => new Date(u.created_at) >= cutoff);
    }

    return filtered;
  }, [users, search, statusFilter, genderFilter, flaggedFilter, registrationFilter]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortBy) {
        case "name":
          return dir * a.name.localeCompare(b.name);
        case "gender":
          return dir * (a.gender || "").localeCompare(b.gender || "");
        case "age":
          return dir * ((a.age || 0) - (b.age || 0));
        case "created_at":
          return (
            dir *
            (new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime())
          );
        case "events":
          return dir * (a.eventsCount - b.eventsCount);
        case "reports":
          return dir * (a.reportsReceived - b.reportsReceived);
        case "blocks":
          return dir * (a.blocksReceived - b.blocksReceived);
        default:
          return 0;
      }
    });
  }, [filteredUsers, sortBy, sortDir]);

  const avgEventsPerUser = useMemo(() => {
    if (users.length === 0) return 0;
    const total = users.reduce((sum, u) => sum + u.eventsCount, 0);
    return (total / users.length).toFixed(1);
  }, [users]);

  const flaggedUsers = useMemo(() => {
    return users.filter((u) => u.reportsReceived > 0 || u.blocksReceived > 0)
      .length;
  }, [users]);

  const formatReportReason = (reason: string) => {
    const reasons: Record<string, string> = {
      inappropriate: "Comportamiento inapropiado",
      harassment: "Acoso",
      fake_profile: "Perfil falso",
      spam: "Spam",
      offensive: "Contenido ofensivo",
      safety: "Seguridad",
      inappropriate_behavior: "Comportamiento inapropiado",
      made_uncomfortable: "Incomodidad",
      spam_fake: "Spam/Falso",
      other: "Otro",
    };
    return reasons[reason] || reason;
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    setIsBanning(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          ban_reason: banReason.trim() || null,
        })
        .eq("user_id", selectedUser.user_id);

      if (error) throw error;

      toast.success(`${selectedUser.name} ha sido suspendido`);
      setBanDialogOpen(false);
      setBanReason("");
      setDetailOpen(false);
      await loadUsers();
    } catch (error: any) {
      console.error("Error banning user:", error);
      toast.error("Error al suspender usuario");
    } finally {
      setIsBanning(false);
    }
  };

  const handleUnbanUser = async (user: UserWithStats) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_banned: false,
          banned_at: null,
          ban_reason: null,
        })
        .eq("user_id", user.user_id);

      if (error) throw error;

      toast.success(`${user.name} ha sido reactivado`);
      setDetailOpen(false);
      await loadUsers();
    } catch (error: any) {
      console.error("Error unbanning user:", error);
      toast.error("Error al reactivar usuario");
    }
  };

  const openEmailDialog = (user: UserWithStats, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEmailTarget(user);
    setEmailSubject("");
    setEmailBody("");
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailTarget || !emailSubject.trim() || !emailBody.trim()) return;
    setIsSendingEmail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await supabase.functions.invoke("send-user-email", {
        body: {
          user_id: emailTarget.user_id,
          subject: emailSubject.trim(),
          body: emailBody.trim(),
        },
      });

      if (response.error) throw response.error;
      const result = response.data as { success: boolean; email?: string; error?: string };
      if (!result.success) throw new Error(result.error || "Error desconocido");

      toast.success(`Email enviado a ${result.email || emailTarget.name}`);
      setEmailDialogOpen(false);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error("Error al enviar email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleQuickBan = (user: UserWithStats, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUser(user);
    setBanReason("");
    setBanDialogOpen(true);
  };

  const handleQuickUnban = async (user: UserWithStats, e: React.MouseEvent) => {
    e.stopPropagation();
    await handleUnbanUser(user);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard value={users.length} label="Total Usuarios" />
        <StatsCard value={mau} label="Nuevos Este Mes" />
        <StatsCard value={avgEventsPerUser} label="Prom. Eventos/Usuario" />
        <StatsCard value={flaggedUsers} label="Con Reportes/Bloqueos" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearch("")}
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filtros:</span>
        </div>

        <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v as GenderFilter)}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Género" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="male">Masculino</SelectItem>
            <SelectItem value="female">Femenino</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="banned">Suspendidos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={flaggedFilter} onValueChange={(v) => setFlaggedFilter(v as FlaggedFilter)}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Reportes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="flagged">Con reportes/bloqueos</SelectItem>
            <SelectItem value="clean">Sin reportes</SelectItem>
          </SelectContent>
        </Select>

        <Select value={registrationFilter} onValueChange={(v) => setRegistrationFilter(v as RegistrationFilter)}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Registro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="this_month">Este mes</SelectItem>
            <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
            <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}

        <span className="text-sm text-muted-foreground ml-auto">
          {filteredUsers.length} de {users.length} usuarios
        </span>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuarios Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHeader
                    column="name"
                    label="Usuario"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableTableHeader
                    column="gender"
                    label="Género"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableTableHeader
                    column="age"
                    label="Edad"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <TableHead>Estado</TableHead>
                  <SortableTableHeader
                    column="created_at"
                    label="Registro"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableTableHeader
                    column="events"
                    label="Eventos"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableTableHeader
                    column="reports"
                    label="Reportes"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableTableHeader
                    column="blocks"
                    label="Bloqueos"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openUserDetail(user)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                          {user.photos?.[0] ? (
                            <img
                              src={user.photos[0]}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">
                              {user.name[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.gender === "male"
                        ? "M"
                        : user.gender === "female"
                        ? "F"
                        : user.gender || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.age || "-"}
                    </TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <Badge className="bg-red-500/20 text-red-700 border-red-500/30">
                          Suspendido
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                          Activo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), "dd MMM yyyy", {
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell>{user.eventsCount}</TableCell>
                    <TableCell>
                      {user.reportsReceived > 0 ? (
                        <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">
                          {user.reportsReceived}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.blocksReceived > 0 ? (
                        <Badge className="bg-red-500/20 text-red-700 border-red-500/30">
                          {user.blocksReceived}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={(e) => openEmailDialog(user, e)}
                          title="Enviar email"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        {user.is_banned ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={(e) => handleQuickUnban(user, e)}
                            title="Reactivar usuario"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => handleQuickBan(user, e)}
                            title="Suspender usuario"
                          >
                            <ShieldBan className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Reportes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reportado</TableHead>
                    <TableHead>Por</TableHead>
                    <TableHead>Razón</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.slice(0, 10).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.reported?.name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {report.reporter?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatReportReason(report.reason)}
                        </Badge>
                        {report.custom_reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {report.custom_reason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {report.events?.name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(report.created_at), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Blocks */}
      {blocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldBan className="w-5 h-5" />
              Bloqueos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bloqueado</TableHead>
                    <TableHead>Por</TableHead>
                    <TableHead>Razón</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.slice(0, 10).map((block) => (
                    <TableRow key={block.id}>
                      <TableCell className="font-medium">
                        {block.blocked?.name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {block.blocker?.name || "—"}
                      </TableCell>
                      <TableCell>
                        {block.reason ? (
                          <Badge variant="outline">
                            {formatReportReason(block.reason)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {block.events?.name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(block.created_at), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          {selectedUser && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {selectedUser.photos?.[0] ? (
                      <img
                        src={selectedUser.photos[0]}
                        alt={selectedUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-muted-foreground">
                        {selectedUser.name[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">
                      {selectedUser.name}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.gender === "male"
                        ? "Masculino"
                        : selectedUser.gender === "female"
                        ? "Femenino"
                        : selectedUser.gender || "—"}
                      {selectedUser.age ? `, ${selectedUser.age} años` : ""}
                      {" · Registro: "}
                      {format(
                        new Date(selectedUser.created_at),
                        "d MMM yyyy",
                        { locale: es }
                      )}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-5 pt-4">
                {/* Ban status banner */}
                {selectedUser.is_banned && (
                  <div className="p-3 rounded-lg border border-red-300 bg-red-50 space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldBan className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">
                        Usuario suspendido
                      </span>
                      {selectedUser.banned_at && (
                        <span className="text-xs text-red-500 ml-auto">
                          {format(new Date(selectedUser.banned_at), "d MMM yyyy", { locale: es })}
                        </span>
                      )}
                    </div>
                    {selectedUser.ban_reason && (
                      <p className="text-sm text-red-600">
                        Razón: {selectedUser.ban_reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Ban/Unban action */}
                <div>
                  {selectedUser.is_banned ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => handleUnbanUser(selectedUser)}
                    >
                      Reactivar usuario
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setBanReason("");
                        setBanDialogOpen(true);
                      }}
                    >
                      <ShieldBan className="w-4 h-4 mr-1" />
                      Suspender usuario
                    </Button>
                  )}
                </div>

                {/* Bio */}
                {selectedUser.bio && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Bio
                    </h4>
                    <p className="text-sm">{selectedUser.bio}</p>
                  </div>
                )}

                {/* Events */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Eventos ({userEvents.length})
                  </h4>
                  {userEvents.length > 0 ? (
                    <div className="space-y-2">
                      {userEvents.map((ev) => (
                        <div
                          key={ev.event_id}
                          className="flex items-center justify-between p-2 rounded-lg border text-sm"
                        >
                          <span className="font-medium">
                            {ev.events?.name || "—"}
                          </span>
                          <span className="text-muted-foreground">
                            {ev.events?.date
                              ? format(
                                  new Date(ev.events.date),
                                  "dd MMM yyyy",
                                  { locale: es }
                                )
                              : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Sin eventos
                    </p>
                  )}
                </div>

                {/* Reports received */}
                {userReports.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-amber-600 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Reportes Recibidos ({userReports.length})
                    </h4>
                    <div className="space-y-2">
                      {userReports.map((r) => (
                        <div
                          key={r.id}
                          className="p-2 rounded-lg border border-amber-200 bg-amber-50 text-sm space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className="border-amber-300 text-amber-700"
                            >
                              {formatReportReason(r.reason)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(r.created_at), "dd MMM yyyy", {
                                locale: es,
                              })}
                            </span>
                          </div>
                          <p className="text-muted-foreground">
                            Por: {r.reporter?.name || "—"} · Evento:{" "}
                            {r.events?.name || "—"}
                          </p>
                          {r.custom_reason && (
                            <p className="text-xs">{r.custom_reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blocks received */}
                {userBlocks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                      <ShieldBan className="w-4 h-4" />
                      Bloqueos Recibidos ({userBlocks.length})
                    </h4>
                    <div className="space-y-2">
                      {userBlocks.map((b) => (
                        <div
                          key={b.id}
                          className="p-2 rounded-lg border border-red-200 bg-red-50 text-sm space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            {b.reason ? (
                              <Badge
                                variant="outline"
                                className="border-red-300 text-red-700"
                              >
                                {formatReportReason(b.reason)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">
                                Sin razón
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(b.created_at), "dd MMM yyyy", {
                                locale: es,
                              })}
                            </span>
                          </div>
                          <p className="text-muted-foreground">
                            Por: {b.blocker?.name || "—"} · Evento:{" "}
                            {b.events?.name || "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban Confirmation Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <ShieldBan className="w-5 h-5" />
              Suspender usuario
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {selectedUser?.name} no podrá acceder a la aplicación mientras esté suspendido.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Razón (opcional)</label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Motivo de la suspensión..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBanDialogOpen(false)}
                disabled={isBanning}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleBanUser}
                disabled={isBanning}
              >
                {isBanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Suspendiendo...
                  </>
                ) : (
                  "Confirmar suspensión"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Compose Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {emailTarget?.photos?.[0] ? (
                  <img
                    src={emailTarget.photos[0]}
                    alt={emailTarget.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">
                    {emailTarget?.name[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Enviar email
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Para: {emailTarget?.name}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Asunto</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Asunto del email..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mensaje</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Escribe tu mensaje..."
                rows={8}
              />
            </div>
            <div className="flex gap-2 justify-end border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
                disabled={isSendingEmail}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={isSendingEmail || !emailSubject.trim() || !emailBody.trim()}
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
