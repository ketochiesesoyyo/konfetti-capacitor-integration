import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePortalContext } from "@/components/portal/PortalLayout";
import { StatsCard } from "@/components/admin/shared/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Users, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseLocalDate } from "@/lib/utils";

interface PortalEvent {
  id: string;
  name: string;
  date: string | null;
  status: string;
  close_date: string;
  image_url: string | null;
  price: number | null;
  currency: string;
  commission_type: string | null;
  commission_value: number | null;
  payment_status: string;
  event_attendees: { count: number }[];
}

const PortalDashboard = () => {
  const navigate = useNavigate();
  const { contactId, contactName } = usePortalContext();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<PortalEvent[]>([]);

  useEffect(() => {
    loadData();
  }, [contactId]);

  const loadData = async () => {
    const { data: eventsData, error } = await supabase
      .from('events')
      .select('id, name, date, status, close_date, image_url, price, currency, commission_type, commission_value, payment_status, event_attendees(count)')
      .eq('contact_id', contactId)
      .order('date', { ascending: false });

    if (!error && eventsData) {
      setEvents(eventsData as PortalEvent[]);
    }
    setIsLoading(false);
  };

  const getEventStatus = (event: PortalEvent): 'draft' | 'closed' | 'active' => {
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

  const totalGuests = events.reduce((acc, e) => acc + (e.event_attendees?.[0]?.count || 0), 0);
  const totalRevenue = events.reduce((acc, e) => {
    if (!e.price || !e.commission_value) return acc;
    if (e.commission_type === 'percentage') {
      return acc + (e.price * e.commission_value / 100);
    }
    // fixed commission
    return acc + e.commission_value;
  }, 0);
  const currency = events.length > 0 ? events[0].currency : 'MXN';

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">Pagado</Badge>;
      case 'partial':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Parcial</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Pendiente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Hola, {contactName}</h1>
        <p className="text-muted-foreground">Resumen de tus eventos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard value={events.length} label="Total Eventos" valueColor="text-primary" />
        <StatsCard value={totalGuests} label="Total Invitados" valueColor="text-emerald-500" />
        <StatsCard value={formatPrice(totalRevenue)} label="Ganancias" valueColor="text-amber-500" />
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Mis Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No tienes eventos aún</p>
              <Button onClick={() => navigate("/portal/request")}>
                Solicitar Evento
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Invitados</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
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
                        {event.date
                          ? format(parseLocalDate(event.date), "dd MMM yyyy", { locale: es })
                          : <span className="text-muted-foreground">Sin fecha</span>
                        }
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
                        {event.price != null
                          ? formatPrice(event.price)
                          : <span className="text-muted-foreground">-</span>
                        }
                      </TableCell>
                      <TableCell>
                        {getPaymentBadge(event.payment_status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/portal/event/${event.id}`)}
                        >
                          Ver
                        </Button>
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

export default PortalDashboard;
