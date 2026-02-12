import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Loader2, Plus, Pencil, Trash2, Users, Search, ChevronDown, ChevronRight, Globe, Instagram, MapPin, Crown, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SortableTableHeader } from "../shared/SortableTableHeader";
import { StatsCard } from "../shared/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CompanyContact {
  id: string;
  contact_name: string;
}

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
  contacts: CompanyContact[];
}

type SortColumn = 'name' | 'city' | 'partnership_tier' | 'contacts' | 'created';

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

interface CompanyFormData {
  name: string;
  notes: string;
  website: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  pinterest: string;
  tiktok: string;
  country: string;
  city: string;
  state: string;
  employee_count: string;
  year_founded: string;
  tax_id: string;
  price_tier: string;
  avg_weddings_per_year: string;
  avg_guest_count: string;
  specialties: string[];
  partnership_tier: string;
  referral_source: string;
  commission_rate: string;
}

const emptyForm: CompanyFormData = {
  name: "", notes: "", website: "", instagram: "", linkedin: "", facebook: "", pinterest: "", tiktok: "",
  country: "", city: "", state: "", employee_count: "", year_founded: "", tax_id: "",
  price_tier: "", avg_weddings_per_year: "", avg_guest_count: "", specialties: [],
  partnership_tier: "", referral_source: "", commission_rate: "",
};

const companyToForm = (c: Company): CompanyFormData => ({
  name: c.name,
  notes: c.notes || "",
  website: c.website || "",
  instagram: c.instagram || "",
  linkedin: c.linkedin || "",
  facebook: c.facebook || "",
  pinterest: c.pinterest || "",
  tiktok: c.tiktok || "",
  country: c.country || "",
  city: c.city || "",
  state: c.state || "",
  employee_count: c.employee_count?.toString() || "",
  year_founded: c.year_founded?.toString() || "",
  tax_id: c.tax_id || "",
  price_tier: c.price_tier || "",
  avg_weddings_per_year: c.avg_weddings_per_year?.toString() || "",
  avg_guest_count: c.avg_guest_count?.toString() || "",
  specialties: c.specialties || [],
  partnership_tier: c.partnership_tier || "",
  referral_source: c.referral_source || "",
  commission_rate: c.commission_rate?.toString() || "",
});

const formToInsert = (f: CompanyFormData) => ({
  name: f.name.trim(),
  notes: f.notes.trim() || null,
  website: f.website.trim() || null,
  instagram: f.instagram.trim() || null,
  linkedin: f.linkedin.trim() || null,
  facebook: f.facebook.trim() || null,
  pinterest: f.pinterest.trim() || null,
  tiktok: f.tiktok.trim() || null,
  country: f.country.trim() || null,
  city: f.city.trim() || null,
  state: f.state.trim() || null,
  employee_count: f.employee_count ? parseInt(f.employee_count) : null,
  year_founded: f.year_founded ? parseInt(f.year_founded) : null,
  tax_id: f.tax_id.trim() || null,
  price_tier: f.price_tier || null,
  avg_weddings_per_year: f.avg_weddings_per_year ? parseInt(f.avg_weddings_per_year) : null,
  avg_guest_count: f.avg_guest_count ? parseInt(f.avg_guest_count) : null,
  specialties: f.specialties.length > 0 ? f.specialties : null,
  partnership_tier: f.partnership_tier || null,
  referral_source: f.referral_source || null,
  commission_rate: f.commission_rate ? parseFloat(f.commission_rate) : null,
});

export const CompaniesTab = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Sort state
  const [sortBy, setSortBy] = useState<SortColumn>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CompanyFormData>({ ...emptyForm });

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState<CompanyFormData>({ ...emptyForm });

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  // Expanded rows for contacts
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*, contacts(id, contact_name)')
      .order('name');

    if (error) {
      console.error(error);
      toast.error("Error al cargar empresas");
    } else {
      setCompanies((data || []) as Company[]);
    }
    setIsLoading(false);
  };

  const toggleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const toggleRow = (companyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }
      return next;
    });
  };

  // Filter by search
  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.country && c.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort
  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'name':
        return dir * a.name.localeCompare(b.name);
      case 'city':
        return dir * (a.city || '').localeCompare(b.city || '');
      case 'partnership_tier': {
        const tierOrder: Record<string, number> = { platinum: 3, gold: 2, silver: 1 };
        return dir * ((tierOrder[a.partnership_tier || ''] || 0) - (tierOrder[b.partnership_tier || ''] || 0));
      }
      case 'contacts':
        return dir * ((a.contacts?.length || 0) - (b.contacts?.length || 0));
      case 'created':
        return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return 0;
    }
  });

  // Stats
  const stats = {
    total: companies.length,
    withContacts: companies.filter(c => c.contacts?.length > 0).length,
  };

  // Create
  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setIsCreating(true);
    const { error } = await supabase
      .from('companies')
      .insert(formToInsert(createForm));

    if (error) {
      console.error(error);
      toast.error("Error al crear empresa");
    } else {
      toast.success("Empresa creada exitosamente");
      setCreateDialogOpen(false);
      setCreateForm({ ...emptyForm });
      await loadCompanies();
    }
    setIsCreating(false);
  };

  // Edit
  const openEdit = (company: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCompany(company);
    setEditForm(companyToForm(company));
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editingCompany || !editForm.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setIsEditing(true);
    const { error } = await supabase
      .from('companies')
      .update(formToInsert(editForm))
      .eq('id', editingCompany.id);

    if (error) {
      console.error(error);
      toast.error("Error al actualizar empresa");
    } else {
      toast.success("Empresa actualizada");
      setEditDialogOpen(false);
      setEditingCompany(null);
      await loadCompanies();
    }
    setIsEditing(false);
  };

  // Delete
  const openDelete = (company: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCompany(company);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCompany) return;

    if (deletingCompany.contacts?.length > 0) {
      toast.error("No se puede eliminar una empresa con contactos vinculados");
      setDeleteDialogOpen(false);
      return;
    }

    setIsDeleting(true);
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', deletingCompany.id);

    if (error) {
      console.error(error);
      toast.error("Error al eliminar empresa");
    } else {
      toast.success("Empresa eliminada");
      setDeleteDialogOpen(false);
      setDeletingCompany(null);
      await loadCompanies();
    }
    setIsDeleting(false);
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

  const renderCompanyFormFields = (
    form: CompanyFormData,
    setForm: React.Dispatch<React.SetStateAction<CompanyFormData>>,
    idPrefix: string
  ) => (
    <div className="space-y-6 py-5 max-h-[60vh] overflow-y-auto pr-1">
      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Información General</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-name`} className="text-sm font-medium">Nombre *</Label>
            <Input id={`${idPrefix}-name`} value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="ej., Wedding Dreams S.A." className="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tier de Alianza</Label>
              <Select value={form.partnership_tier} onValueChange={(v) => setForm(prev => ({ ...prev, partnership_tier: v }))}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {PARTNERSHIP_TIERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Segmento de Precio</Label>
              <Select value={form.price_tier} onValueChange={(v) => setForm(prev => ({ ...prev, price_tier: v }))}>
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
              <Select value={form.referral_source} onValueChange={(v) => setForm(prev => ({ ...prev, referral_source: v }))}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {REFERRAL_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-commission`} className="text-sm font-medium">Comisión (%)</Label>
              <Input id={`${idPrefix}-commission`} type="number" min="0" max="100" step="0.5" value={form.commission_rate} onChange={(e) => setForm(prev => ({ ...prev, commission_rate: e.target.value }))} placeholder="ej., 15" className="h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-notes`} className="text-sm font-medium">Notas</Label>
            <Textarea id={`${idPrefix}-notes`} value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notas adicionales..." rows={2} />
          </div>
        </div>
      </div>

      {/* Wedding Planner Specifics */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Perfil de Wedding Planner</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-avg-weddings`} className="text-sm font-medium">Bodas / año</Label>
              <Input id={`${idPrefix}-avg-weddings`} type="number" min="0" value={form.avg_weddings_per_year} onChange={(e) => setForm(prev => ({ ...prev, avg_weddings_per_year: e.target.value }))} placeholder="ej., 25" className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-avg-guests`} className="text-sm font-medium">Invitados promedio</Label>
              <Input id={`${idPrefix}-avg-guests`} type="number" min="0" value={form.avg_guest_count} onChange={(e) => setForm(prev => ({ ...prev, avg_guest_count: e.target.value }))} placeholder="ej., 150" className="h-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Especialidades</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES_OPTIONS.map((spec) => {
                const isSelected = form.specialties.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setForm(prev => ({
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
            <Label htmlFor={`${idPrefix}-country`} className="text-sm font-medium">País</Label>
            <Input id={`${idPrefix}-country`} value={form.country} onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))} placeholder="México" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-state`} className="text-sm font-medium">Estado</Label>
            <Input id={`${idPrefix}-state`} value={form.state} onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))} placeholder="Jalisco" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-city`} className="text-sm font-medium">Ciudad</Label>
            <Input id={`${idPrefix}-city`} value={form.city} onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))} placeholder="Guadalajara" className="h-10" />
          </div>
        </div>
      </div>

      {/* Social & Web */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Redes y Web</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-website`} className="text-sm font-medium">Sitio Web</Label>
              <Input id={`${idPrefix}-website`} value={form.website} onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))} placeholder="https://..." className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-instagram`} className="text-sm font-medium">Instagram</Label>
              <Input id={`${idPrefix}-instagram`} value={form.instagram} onChange={(e) => setForm(prev => ({ ...prev, instagram: e.target.value }))} placeholder="@weddingdreams" className="h-10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-linkedin`} className="text-sm font-medium">LinkedIn</Label>
              <Input id={`${idPrefix}-linkedin`} value={form.linkedin} onChange={(e) => setForm(prev => ({ ...prev, linkedin: e.target.value }))} placeholder="URL de LinkedIn" className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-facebook`} className="text-sm font-medium">Facebook</Label>
              <Input id={`${idPrefix}-facebook`} value={form.facebook} onChange={(e) => setForm(prev => ({ ...prev, facebook: e.target.value }))} placeholder="URL de Facebook" className="h-10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-pinterest`} className="text-sm font-medium">Pinterest</Label>
              <Input id={`${idPrefix}-pinterest`} value={form.pinterest} onChange={(e) => setForm(prev => ({ ...prev, pinterest: e.target.value }))} placeholder="URL de Pinterest" className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-tiktok`} className="text-sm font-medium">TikTok</Label>
              <Input id={`${idPrefix}-tiktok`} value={form.tiktok} onChange={(e) => setForm(prev => ({ ...prev, tiktok: e.target.value }))} placeholder="@handle" className="h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Datos de Empresa</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-employees`} className="text-sm font-medium">Empleados</Label>
            <Input id={`${idPrefix}-employees`} type="number" min="0" value={form.employee_count} onChange={(e) => setForm(prev => ({ ...prev, employee_count: e.target.value }))} placeholder="ej., 10" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-founded`} className="text-sm font-medium">Año fundación</Label>
            <Input id={`${idPrefix}-founded`} type="number" min="1900" max={new Date().getFullYear()} value={form.year_founded} onChange={(e) => setForm(prev => ({ ...prev, year_founded: e.target.value }))} placeholder="ej., 2018" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-tax-id`} className="text-sm font-medium">RFC / Tax ID</Label>
            <Input id={`${idPrefix}-tax-id`} value={form.tax_id} onChange={(e) => setForm(prev => ({ ...prev, tax_id: e.target.value }))} placeholder="RFC..." className="h-10" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <StatsCard value={stats.total} label="Total Empresas" valueColor="text-primary" />
        <StatsCard value={stats.withContacts} label="Con Contactos" valueColor="text-emerald-500" />
      </div>

      {/* Companies Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Empresas
          </CardTitle>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Crear Empresa
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, ciudad o país..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? (
                <p>No se encontraron empresas con "{searchQuery}"</p>
              ) : (
                <>
                  <p className="mb-4">No hay empresas registradas</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primera empresa
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <SortableTableHeader column="name" label="Nombre" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="city" label="Ubicación" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="partnership_tier" label="Tier" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <TableHead className="text-center">Redes</TableHead>
                    <SortableTableHeader column="contacts" label="Contactos" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="created" label="Creado" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCompanies.map((company) => {
                    const isExpanded = expandedRows.has(company.id);
                    const contactCount = company.contacts?.length || 0;
                    const location = [company.city, company.state, company.country].filter(Boolean).join(", ");

                    return (
                      <>
                        <TableRow
                          key={company.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => navigate(`/admin/company/${company.id}`)}
                        >
                          <TableCell className="w-8 pr-0">
                            {contactCount > 0 && (
                              <button
                                onClick={(e) => toggleRow(company.id, e)}
                                className="p-1 rounded hover:bg-muted"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {company.name}
                              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {location ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate max-w-[150px]">{location}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getTierBadge(company.partnership_tier) || <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {company.instagram && <Instagram className="w-3.5 h-3.5 text-pink-500" />}
                              {company.website && <Globe className="w-3.5 h-3.5 text-blue-500" />}
                              {!company.instagram && !company.website && <span className="text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{contactCount}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(company.created_at), "d MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => openEdit(company, e)}
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => openDelete(company, e)}
                                title="Eliminar"
                                disabled={contactCount > 0}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && contactCount > 0 && (
                          <TableRow key={`${company.id}-contacts`} className="bg-muted/30">
                            <TableCell colSpan={8} className="py-3 px-8">
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                  Contactos vinculados
                                </p>
                                {company.contacts.map((contact) => (
                                  <div key={contact.id} className="flex items-center gap-2 text-sm py-1">
                                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                    {contact.contact_name}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Company Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) setCreateForm({ ...emptyForm });
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Crear Nueva Empresa</DialogTitle>
                <DialogDescription className="mt-1">
                  Agrega una nueva empresa u organización
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {renderCompanyFormFields(createForm, setCreateForm, "create")}

          <DialogFooter className="border-t pt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isCreating} className="h-11">
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating} className="h-11 px-6">
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Empresa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) setEditingCompany(null);
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
                  Modifica los datos de la empresa
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {renderCompanyFormFields(editForm, setEditForm, "edit")}

          <DialogFooter className="border-t pt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isEditing} className="h-11">
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isEditing} className="h-11 px-6">
              {isEditing ? (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCompany && deletingCompany.contacts?.length > 0 ? (
                <>
                  No se puede eliminar <strong>{deletingCompany.name}</strong> porque tiene{" "}
                  {deletingCompany.contacts.length} contacto(s) vinculado(s).
                  Primero debes desvincular o eliminar los contactos.
                </>
              ) : (
                <>
                  ¿Estás seguro de que quieres eliminar <strong>{deletingCompany?.name}</strong>?
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            {deletingCompany && (deletingCompany.contacts?.length || 0) === 0 && (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
