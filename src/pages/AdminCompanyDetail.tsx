import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  Users,
  Loader2,
  Pencil,
  ArrowLeft,
  Globe,
  Instagram,
  Linkedin,
  Facebook,
  MapPin,
  Phone,
  Mail,
  Crown,
  ExternalLink,
  Hash,
  Percent,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { parseLocalDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAdminContext } from "@/components/admin/AdminLayout";

interface Company {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  website: string | null;
  instagram: string | null;
  linkedin: string | null;
  facebook: string | null;
  pinterest: string | null;
  tiktok: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  regions_covered: string[] | null;
  employee_count: number | null;
  year_founded: number | null;
  logo_url: string | null;
  tax_id: string | null;
  price_tier: string | null;
  avg_weddings_per_year: number | null;
  avg_guest_count: number | null;
  specialties: string[] | null;
  partnership_tier: string | null;
  referral_source: string | null;
  commission_rate: number | null;
}

interface CompanyContact {
  id: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  contact_type: string;
  status: string;
}

interface CompanyEvent {
  id: string;
  name: string;
  date: string | null;
  status: string;
  invite_code: string;
  price: number | null;
  currency: string;
  payment_status: string;
  event_attendees: { count: number }[];
}

const PRICE_TIERS = [
  { value: "budget", label: "Budget" },
  { value: "mid", label: "Mid-range" },
  { value: "luxury", label: "Luxury" },
  { value: "ultra_luxury", label: "Ultra Luxury" },
];

const PARTNERSHIP_TIERS = [
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
];

const REFERRAL_SOURCES = [
  { value: "referral", label: "Referido" },
  { value: "instagram", label: "Instagram" },
  { value: "event", label: "Evento" },
  { value: "cold_outreach", label: "Contacto directo" },
  { value: "website", label: "Sitio web" },
  { value: "other", label: "Otro" },
];

const SPECIALTIES_OPTIONS = [
  "Destino", "Cultural", "Religiosa", "Same-sex", "Íntima/Elopement", "Gran escala", "Playa", "Hacienda",
];

const formatCurrency = (amount: number, currency: string = "MXN") => {
  const symbols: Record<string, string> = { MXN: "$", USD: "$", INR: "₹" };
  return `${symbols[currency] || "$"}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const AdminCompanyDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [events, setEvents] = useState<CompanyEvent[]>([]);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", notes: "", phone: "", email: "",
    website: "", instagram: "", linkedin: "", facebook: "", pinterest: "", tiktok: "",
    country: "", city: "", state: "", regions_covered: "", employee_count: "", year_founded: "", tax_id: "",
    price_tier: "", avg_weddings_per_year: "", avg_guest_count: "", specialties: [] as string[],
    partnership_tier: "", referral_source: "", commission_rate: "",
  });

  useEffect(() => {
    loadCompany();
  }, [id]);

  const loadCompany = async () => {
    if (!id) return;
    setIsLoading(true);

    // Load company
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (companyError || !companyData) {
      toast.error("Empresa no encontrada");
      navigate("/admin/companies");
      return;
    }

    setCompany(companyData as Company);

    // Load contacts for this company
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('id, contact_name, email, phone, contact_type, status')
      .eq('company_id', id)
      .order('contact_name');

    setContacts((contactsData || []) as CompanyContact[]);

    // Load events via contacts
    const contactIds = (contactsData || []).map(c => c.id);
    if (contactIds.length > 0) {
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, name, date, status, invite_code, price, currency, payment_status, event_attendees(count)')
        .in('contact_id', contactIds)
        .order('date', { ascending: false });

      setEvents((eventsData || []) as CompanyEvent[]);
    }

    setIsLoading(false);
  };

  const openEdit = () => {
    if (!company) return;
    setEditForm({
      name: company.name,
      notes: company.notes || "",
      phone: company.phone || "",
      email: company.email || "",
      website: company.website || "",
      instagram: company.instagram || "",
      linkedin: company.linkedin || "",
      facebook: company.facebook || "",
      pinterest: company.pinterest || "",
      tiktok: company.tiktok || "",
      country: company.country || "",
      city: company.city || "",
      state: company.state || "",
      regions_covered: company.regions_covered?.join(", ") || "",
      employee_count: company.employee_count?.toString() || "",
      year_founded: company.year_founded?.toString() || "",
      tax_id: company.tax_id || "",
      price_tier: company.price_tier || "",
      avg_weddings_per_year: company.avg_weddings_per_year?.toString() || "",
      avg_guest_count: company.avg_guest_count?.toString() || "",
      specialties: company.specialties || [],
      partnership_tier: company.partnership_tier || "",
      referral_source: company.referral_source || "",
      commission_rate: company.commission_rate?.toString() || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!company || !editForm.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase
      .from('companies')
      .update({
        name: editForm.name.trim(),
        notes: editForm.notes.trim() || null,
        phone: editForm.phone.trim() || null,
        email: editForm.email.trim() || null,
        website: editForm.website.trim() || null,
        instagram: editForm.instagram.trim() || null,
        linkedin: editForm.linkedin.trim() || null,
        facebook: editForm.facebook.trim() || null,
        pinterest: editForm.pinterest.trim() || null,
        tiktok: editForm.tiktok.trim() || null,
        country: editForm.country.trim() || null,
        city: editForm.city.trim() || null,
        state: editForm.state.trim() || null,
        regions_covered: editForm.regions_covered.trim() ? editForm.regions_covered.split(",").map(s => s.trim()).filter(Boolean) : null,
        employee_count: editForm.employee_count ? parseInt(editForm.employee_count) : null,
        year_founded: editForm.year_founded ? parseInt(editForm.year_founded) : null,
        tax_id: editForm.tax_id.trim() || null,
        price_tier: editForm.price_tier || null,
        avg_weddings_per_year: editForm.avg_weddings_per_year ? parseInt(editForm.avg_weddings_per_year) : null,
        avg_guest_count: editForm.avg_guest_count ? parseInt(editForm.avg_guest_count) : null,
        specialties: editForm.specialties.length > 0 ? editForm.specialties : null,
        partnership_tier: editForm.partnership_tier || null,
        referral_source: editForm.referral_source || null,
        commission_rate: editForm.commission_rate ? parseFloat(editForm.commission_rate) : null,
      })
      .eq('id', company.id);

    if (error) {
      console.error(error);
      toast.error("Error al actualizar empresa");
    } else {
      toast.success("Empresa actualizada");
      setEditDialogOpen(false);
      await loadCompany();
    }
    setIsUpdating(false);
  };

  const getTierBadge = (tier: string | null) => {
    if (!tier) return null;
    const colors: Record<string, string> = {
      platinum: "bg-violet-500/20 text-violet-700 border-violet-500/30 dark:text-violet-400",
      gold: "bg-amber-500/20 text-amber-700 border-amber-500/30 dark:text-amber-400",
      silver: "bg-gray-500/20 text-gray-700 border-gray-500/30 dark:text-gray-400",
    };
    return (
      <Badge variant="outline" className={cn("text-xs", colors[tier] || "")}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const getPriceTierLabel = (tier: string | null) => {
    return PRICE_TIERS.find(t => t.value === tier)?.label || tier;
  };

  const getReferralLabel = (source: string | null) => {
    return REFERRAL_SOURCES.find(s => s.value === source)?.label || source;
  };

  // Revenue stats
  const totalRevenue = events.reduce((sum, e) => e.payment_status === 'paid' && e.price ? sum + e.price : sum, 0);
  const pendingRevenue = events.reduce((sum, e) => (e.payment_status === 'pending' || e.payment_status === 'partial') && e.price ? sum + e.price : sum, 0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) return null;

  const location = [company.city, company.state, company.country].filter(Boolean).join(", ");
  const socialLinks = [
    { url: company.website, icon: Globe, label: "Website", color: "text-blue-500" },
    { url: company.instagram, icon: Instagram, label: "Instagram", color: "text-pink-500" },
    { url: company.linkedin, icon: Linkedin, label: "LinkedIn", color: "text-blue-700" },
    { url: company.facebook, icon: Facebook, label: "Facebook", color: "text-blue-600" },
  ].filter(l => l.url);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/companies")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold">{company.name}</h1>
              {getTierBadge(company.partnership_tier)}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {location}
                </span>
              )}
              {company.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {company.phone}
                </span>
              )}
              {company.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {company.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Desde {format(new Date(company.created_at), "MMMM yyyy", { locale: es })}
              </span>
            </div>
          </div>
        </div>
        <Button onClick={openEdit}>
          <Pencil className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-sm text-muted-foreground">Contactos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-sm text-muted-foreground">Eventos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-sm text-muted-foreground">Ingresos Pagados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(pendingRevenue)}
            </div>
            <p className="text-sm text-muted-foreground">Por Cobrar</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Company Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Perfil de Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {company.price_tier && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Segmento</p>
                  <p className="font-medium">{getPriceTierLabel(company.price_tier)}</p>
                </div>
              )}
              {company.referral_source && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Fuente</p>
                  <p className="font-medium">{getReferralLabel(company.referral_source)}</p>
                </div>
              )}
              {company.commission_rate != null && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Comisión</p>
                  <p className="font-medium">{company.commission_rate}%</p>
                </div>
              )}
              {company.employee_count != null && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Empleados</p>
                  <p className="font-medium">{company.employee_count}</p>
                </div>
              )}
              {company.year_founded != null && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Año Fundación</p>
                  <p className="font-medium">{company.year_founded}</p>
                </div>
              )}
              {company.tax_id && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">RFC</p>
                  <p className="font-medium font-mono text-sm">{company.tax_id}</p>
                </div>
              )}
            </div>

            {company.regions_covered && company.regions_covered.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Ciudades / Regiones que cubre</p>
                <div className="flex flex-wrap gap-1.5">
                  {company.regions_covered.map((region) => (
                    <Badge key={region} variant="secondary" className="text-xs">{region}</Badge>
                  ))}
                </div>
              </div>
            )}

            {company.notes && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notas</p>
                <p className="text-sm whitespace-pre-wrap">{company.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wedding Planner Profile + Social */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Perfil de Wedding Planner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {company.avg_weddings_per_year != null && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Bodas / Año</p>
                    <p className="text-xl font-bold">{company.avg_weddings_per_year}</p>
                  </div>
                )}
                {company.avg_guest_count != null && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Invitados Prom.</p>
                    <p className="text-xl font-bold">{company.avg_guest_count}</p>
                  </div>
                )}
              </div>
              {company.specialties && company.specialties.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Especialidades</p>
                  <div className="flex flex-wrap gap-1.5">
                    {company.specialties.map((spec) => (
                      <Badge key={spec} variant="secondary" className="text-xs">{spec}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {!company.avg_weddings_per_year && !company.avg_guest_count && (!company.specialties || company.specialties.length === 0) && (
                <p className="text-sm text-muted-foreground">Sin datos de perfil de wedding planner. Haz clic en Editar para agregar.</p>
              )}
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Redes y Web
              </CardTitle>
            </CardHeader>
            <CardContent>
              {socialLinks.length > 0 ? (
                <div className="space-y-2">
                  {socialLinks.map((link) => {
                    const Icon = link.icon;
                    const href = link.url!.startsWith("http") ? link.url! : `https://${link.url}`;
                    return (
                      <a
                        key={link.label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <Icon className={cn("w-4 h-4", link.color)} />
                        <span className="text-sm flex-1 truncate">{link.url}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    );
                  })}
                  {company.pinterest && (
                    <a href={company.pinterest.startsWith("http") ? company.pinterest : `https://${company.pinterest}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                      <span className="w-4 h-4 text-red-500 text-xs font-bold flex items-center justify-center">P</span>
                      <span className="text-sm flex-1 truncate">{company.pinterest}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {company.tiktok && (
                    <a href={company.tiktok.startsWith("http") ? company.tiktok : `https://tiktok.com/${company.tiktok}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                      <span className="w-4 h-4 text-foreground text-xs font-bold flex items-center justify-center">T</span>
                      <span className="text-sm flex-1 truncate">{company.tiktok}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin redes sociales configuradas.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Contactos ({contacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No hay contactos vinculados a esta empresa.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/client/${contact.id}`)}
                  >
                    <TableCell className="font-medium">{contact.contact_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {contact.contact_type === 'wedding_planner' ? 'W. Planner' : 'Pareja'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{contact.email || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{contact.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          contact.status === 'active'
                            ? "bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                            : "bg-gray-500/20 text-gray-700 border-gray-500/30"
                        )}
                      >
                        {contact.status === 'active' ? 'Activo' : contact.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Eventos ({events.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No hay eventos asociados a esta empresa.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Asistentes</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/event/${event.id}`)}
                  >
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.date ? format(parseLocalDate(event.date), "d MMM yyyy", { locale: es }) : "Sin fecha"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {event.event_attendees?.[0]?.count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.price ? formatCurrency(event.price, event.currency) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          event.payment_status === 'paid'
                            ? "bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                            : event.payment_status === 'partial'
                              ? "bg-amber-500/20 text-amber-700 border-amber-500/30 dark:text-amber-400"
                              : "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400"
                        )}
                      >
                        {event.payment_status === 'paid' ? 'Pagado' : event.payment_status === 'partial' ? 'Parcial' : 'Pendiente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Editar Empresa</DialogTitle>
                <DialogDescription className="mt-1">
                  Modifica los datos de {company.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-5 max-h-[60vh] overflow-y-auto pr-1">
            {/* General Info */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Información General</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nombre *</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="h-10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Teléfono</Label>
                    <Input value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+52 33 1234 5678" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <Input type="email" value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} placeholder="info@empresa.com" className="h-10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tier de Alianza</Label>
                    <Select value={editForm.partnership_tier} onValueChange={(v) => setEditForm(prev => ({ ...prev, partnership_tier: v }))}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {PARTNERSHIP_TIERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Segmento de Precio</Label>
                    <Select value={editForm.price_tier} onValueChange={(v) => setEditForm(prev => ({ ...prev, price_tier: v }))}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {PRICE_TIERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Fuente de Referido</Label>
                    <Select value={editForm.referral_source} onValueChange={(v) => setEditForm(prev => ({ ...prev, referral_source: v }))}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {REFERRAL_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Comisión (%)</Label>
                    <Input type="number" min="0" max="100" step="0.5" value={editForm.commission_rate} onChange={(e) => setEditForm(prev => ({ ...prev, commission_rate: e.target.value }))} className="h-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Notas</Label>
                  <Textarea value={editForm.notes} onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
                </div>
              </div>
            </div>

            {/* Wedding Planner */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Perfil de Wedding Planner</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Bodas / año</Label>
                    <Input type="number" min="0" value={editForm.avg_weddings_per_year} onChange={(e) => setEditForm(prev => ({ ...prev, avg_weddings_per_year: e.target.value }))} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Invitados promedio</Label>
                    <Input type="number" min="0" value={editForm.avg_guest_count} onChange={(e) => setEditForm(prev => ({ ...prev, avg_guest_count: e.target.value }))} className="h-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Especialidades</Label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES_OPTIONS.map((spec) => {
                      const isSelected = editForm.specialties.includes(spec);
                      return (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => setEditForm(prev => ({
                            ...prev,
                            specialties: isSelected
                              ? prev.specialties.filter(s => s !== spec)
                              : [...prev.specialties, spec]
                          }))}
                          className={cn(
                            "px-3 py-1.5 text-xs rounded-full border transition-colors",
                            isSelected
                              ? "bg-primary/10 border-primary/30 text-primary font-medium"
                              : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {spec}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ubicación</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">País</Label>
                  <Input value={editForm.country} onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))} placeholder="México" className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estado</Label>
                  <Input value={editForm.state} onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))} placeholder="Jalisco" className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ciudad (sede)</Label>
                  <Input value={editForm.city} onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))} placeholder="Guadalajara" className="h-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ciudades / Regiones que cubre</Label>
                <Input value={editForm.regions_covered} onChange={(e) => setEditForm(prev => ({ ...prev, regions_covered: e.target.value }))} placeholder="Guadalajara, CDMX, Cancún, San Miguel de Allende..." className="h-10" />
                <p className="text-xs text-muted-foreground">Separadas por coma</p>
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Redes y Web</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sitio Web</Label>
                    <Input value={editForm.website} onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))} placeholder="https://..." className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Instagram</Label>
                    <Input value={editForm.instagram} onChange={(e) => setEditForm(prev => ({ ...prev, instagram: e.target.value }))} placeholder="@handle" className="h-10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">LinkedIn</Label>
                    <Input value={editForm.linkedin} onChange={(e) => setEditForm(prev => ({ ...prev, linkedin: e.target.value }))} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Facebook</Label>
                    <Input value={editForm.facebook} onChange={(e) => setEditForm(prev => ({ ...prev, facebook: e.target.value }))} className="h-10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Pinterest</Label>
                    <Input value={editForm.pinterest} onChange={(e) => setEditForm(prev => ({ ...prev, pinterest: e.target.value }))} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">TikTok</Label>
                    <Input value={editForm.tiktok} onChange={(e) => setEditForm(prev => ({ ...prev, tiktok: e.target.value }))} className="h-10" />
                  </div>
                </div>
              </div>
            </div>

            {/* Business */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Datos de Empresa</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Empleados</Label>
                  <Input type="number" min="0" value={editForm.employee_count} onChange={(e) => setEditForm(prev => ({ ...prev, employee_count: e.target.value }))} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Año fundación</Label>
                  <Input type="number" min="1900" max={new Date().getFullYear()} value={editForm.year_founded} onChange={(e) => setEditForm(prev => ({ ...prev, year_founded: e.target.value }))} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">RFC / Tax ID</Label>
                  <Input value={editForm.tax_id} onChange={(e) => setEditForm(prev => ({ ...prev, tax_id: e.target.value }))} className="h-10" />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isUpdating} className="h-11">
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating} className="h-11 px-6">
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCompanyDetail;
