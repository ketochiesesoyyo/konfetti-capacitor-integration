import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePortalContext } from "@/components/portal/PortalLayout";
import { StatsCard } from "@/components/admin/shared/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar, Users, Heart, Sparkles, ImageIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseLocalDate } from "@/lib/utils";

const PortalEventDetail = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { contactId } = usePortalContext();
  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [stats, setStats] = useState({
    totalGuests: 0,
    totalLikes: 0,
    matchesCreated: 0,
  });

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    if (!eventId) return;

    // Load event (RLS ensures only their own events are accessible)
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('contact_id', contactId)
      .single();

    if (eventError || !eventData) {
      navigate("/portal");
      return;
    }

    setEvent(eventData);

    // Load stats
    const [attendeesResult, matchesResult, likesResult] = await Promise.all([
      supabase
        .from('event_attendees')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId),
      supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId),
      supabase
        .from('swipes')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('direction', 'right'),
    ]);

    setStats({
      totalGuests: attendeesResult.count || 0,
      matchesCreated: matchesResult.count || 0,
      totalLikes: likesResult.count || 0,
    });

    setIsLoading(false);
  };

  const getEventStatus = (): 'draft' | 'closed' | 'active' => {
    if (!event) return 'draft';
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

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: event?.currency || 'MXN',
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

  if (!event) return null;

  const status = getEventStatus();

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate("/portal")} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Volver al Dashboard
      </Button>

      {/* Event Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <Badge
              variant="outline"
              className={
                status === 'draft'
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                  : status === 'closed'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              }
            >
              {status === 'draft' ? 'Borrador' : status === 'closed' ? 'Cerrado' : 'Activo'}
            </Badge>
          </div>
          {event.date && (
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="w-4 h-4" />
              {format(parseLocalDate(event.date), "EEEE dd 'de' MMMM, yyyy", { locale: es })}
            </p>
          )}
          {event.description && (
            <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          value={stats.totalGuests}
          label="Invitados"
          valueColor="text-primary"
        />
        <StatsCard
          value={stats.matchesCreated}
          label="Matches"
          valueColor="text-pink-500"
        />
        <StatsCard
          value={stats.totalLikes}
          label="Likes"
          valueColor="text-rose-400"
        />
      </div>

      {/* Financial Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Información de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Precio</p>
              <p className="text-lg font-semibold">
                {event.price != null ? formatPrice(event.price) : "Sin definir"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado de Pago</p>
              <div className="mt-1">
                {getPaymentBadge(event.payment_status)}
              </div>
            </div>
            {event.payment_date && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Pago</p>
                <p className="text-sm">
                  {format(parseLocalDate(event.payment_date), "dd MMM yyyy", { locale: es })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {event.date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha del Evento</span>
              <span>{format(parseLocalDate(event.date), "dd MMM yyyy", { locale: es })}</span>
            </div>
          )}
          {event.close_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cierre de Registro</span>
              <span>{format(parseLocalDate(event.close_date), "dd MMM yyyy", { locale: es })}</span>
            </div>
          )}
          {event.matchmaking_start_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inicio de Matchmaking</span>
              <span>{format(parseLocalDate(event.matchmaking_start_date), "dd MMM yyyy", { locale: es })}</span>
            </div>
          )}
          {event.matchmaking_close_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cierre de Matchmaking</span>
              <span>{format(parseLocalDate(event.matchmaking_close_date), "dd MMM yyyy", { locale: es })}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortalEventDetail;
