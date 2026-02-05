import { useState } from "react";
import { Users, LinkIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseLocalDate } from "@/lib/utils";
import { SortableTableHeader } from "../shared/SortableTableHeader";
import { StatsCard } from "../shared/StatsCard";

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
  events: { name: string } | null;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente", color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400" },
  { value: "contacted", label: "Contactado", color: "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:text-blue-400" },
  { value: "paid", label: "Pagado", color: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" },
  { value: "lost", label: "Perdido", color: "bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400" },
];

type SortColumn = 'name' | 'date' | 'guests' | 'type' | 'status' | 'created';

interface LeadsTabProps {
  requests: EventRequest[];
  isLoading: boolean;
  updatingStatus: string | null;
  onUpdateStatus: (requestId: string, newStatus: string) => void;
  onOpenDetails: (request: EventRequest) => void;
}

export const LeadsTab = ({
  requests,
  isLoading,
  updatingStatus,
  onUpdateStatus,
  onOpenDetails,
}: LeadsTabProps) => {
  const [sortBy, setSortBy] = useState<SortColumn>('created');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Filter to only show leads (pending/contacted), exclude lost
  const leads = requests.filter(r => r.status === 'pending' || r.status === 'contacted');

  const toggleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'name':
        return dir * `${a.partner1_name} & ${a.partner2_name}`.localeCompare(`${b.partner1_name} & ${b.partner2_name}`);
      case 'date':
        return dir * (new Date(a.wedding_date).getTime() - new Date(b.wedding_date).getTime());
      case 'guests':
        return dir * (a.expected_guests - b.expected_guests);
      case 'type':
        return dir * a.submitter_type.localeCompare(b.submitter_type);
      case 'status':
        return dir * a.status.localeCompare(b.status);
      case 'created':
        return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return 0;
    }
  });

  const stats = {
    total: leads.length,
    pending: leads.filter(r => r.status === 'pending').length,
    contacted: leads.filter(r => r.status === 'contacted').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatsCard value={stats.total} label="Total Leads" />
        <StatsCard value={stats.pending} label="Pendientes" valueColor="text-amber-500" />
        <StatsCard value={stats.contacted} label="Contactados" valueColor="text-primary" />
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Leads Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay leads activos
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHeader column="name" label="Evento / Pareja" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="date" label="Fecha Boda" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="guests" label="Invitados" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="type" label="Tipo" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="status" label="Estado" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="created" label="Recibido" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLeads.map((request) => (
                    <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onOpenDetails(request)}>
                      <TableCell className="font-medium">
                        {request.event_id && request.events?.name ? (
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-3 h-3 text-muted-foreground" />
                            {request.events.name}
                          </div>
                        ) : (
                          <span>{request.partner1_name} & {request.partner2_name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(parseLocalDate(request.wedding_date), "dd MMM yyyy", { locale: es })}
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
                          onValueChange={(value) => onUpdateStatus(request.id, value)}
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
  );
};
