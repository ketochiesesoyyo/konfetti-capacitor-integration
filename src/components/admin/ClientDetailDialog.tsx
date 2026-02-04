import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Phone, Building2, Calendar, ExternalLink, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Client {
  id: string;
  client_type: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  source_request_id: string | null;
  events: { id: string; name: string; date: string | null; status?: string }[];
}

interface ClientDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onEdit: () => void;
}

export const ClientDetailDialog = ({ open, onOpenChange, client, onEdit }: ClientDetailDialogProps) => {
  const navigate = useNavigate();

  if (!client) return null;

  const getEventStatusBadge = (status?: string) => {
    if (status === 'closed') {
      return <Badge variant="secondary">Cerrado</Badge>;
    }
    return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-400">Activo</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{client.contact_name}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {client.company_name && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {client.company_name}
              </span>
            )}
            <Badge variant="secondary">
              {client.client_type === 'couple' ? 'Pareja' : 'Wedding Planner'}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Contact Info */}
          <div className="flex flex-wrap gap-4">
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Mail className="w-4 h-4" />
                {client.email}
              </a>
            )}
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Phone className="w-4 h-4" />
                {client.phone}
              </a>
            )}
          </div>

          {/* Events Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Eventos ({client.events?.length || 0})
            </h4>
            {client.events && client.events.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>
                          {event.date ? (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(event.date), "dd MMM yyyy", { locale: es })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onOpenChange(false);
                              navigate(`/event-dashboard/${event.id}?from=admin`);
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-3 px-4 bg-muted/50 rounded-lg">
                Este cliente no tiene eventos asociados
              </p>
            )}
          </div>

          {/* Notes Section */}
          {client.notes && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Notas
              </h4>
              <p className="text-sm bg-muted/50 p-3 rounded-lg">
                {client.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Cliente desde: {format(new Date(client.created_at), "dd MMM yyyy", { locale: es })}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button onClick={onEdit} className="gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
