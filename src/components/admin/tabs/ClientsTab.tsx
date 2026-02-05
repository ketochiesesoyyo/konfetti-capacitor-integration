import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Loader2, Building2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SortableTableHeader } from "../shared/SortableTableHeader";
import { StatsCard } from "../shared/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  companies: { name: string } | null;
  events: { id: string }[];
}

interface Company {
  id: string;
  name: string;
}

type SortColumn = 'name' | 'company' | 'email' | 'events' | 'status' | 'created';

interface ClientsTabProps {
  clients: Contact[];
  isLoading: boolean;
  onClientCreated?: () => void;
}

export const ClientsTab = ({ clients, isLoading, onClientCreated }: ClientsTabProps) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortColumn>('created');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false);

  const [formData, setFormData] = useState({
    clientName: "",
    clientType: "couple" as "couple" | "wedding_planner",
    clientEmail: "",
    clientPhone: "",
    companyId: "",
    newCompanyName: "",
  });

  // Load companies when dialog opens
  useEffect(() => {
    const loadCompanies = async () => {
      const { data } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      if (data) {
        setCompanies(data);
      }
    };
    if (createDialogOpen) {
      loadCompanies();
    }
  }, [createDialogOpen]);

  const resetForm = () => {
    setFormData({
      clientName: "",
      clientType: "couple",
      clientEmail: "",
      clientPhone: "",
      companyId: "",
      newCompanyName: "",
    });
    setShowNewCompanyInput(false);
  };

  const handleCreateClient = async () => {
    if (!formData.clientName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setIsCreating(true);

    try {
      let companyId: string | null = null;

      // Handle company creation/selection for wedding planners
      if (formData.clientType === 'wedding_planner') {
        if (formData.companyId) {
          companyId = formData.companyId;
        } else if (formData.newCompanyName?.trim()) {
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({ name: formData.newCompanyName.trim() })
            .select()
            .single();

          if (companyError) {
            throw new Error("Error al crear empresa");
          }
          companyId = newCompany.id;
        }
      }

      // Check if contact already exists with this email
      if (formData.clientEmail) {
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('email', formData.clientEmail)
          .single();

        if (existingContact) {
          toast.error("Ya existe un cliente con este email");
          setIsCreating(false);
          return;
        }
      }

      // Create the contact
      const { error: contactError } = await supabase
        .from('contacts')
        .insert({
          contact_name: formData.clientName.trim(),
          contact_type: formData.clientType,
          email: formData.clientEmail || null,
          phone: formData.clientPhone || null,
          company_id: companyId,
          status: 'active',
        });

      if (contactError) {
        throw new Error("Error al crear cliente");
      }

      toast.success("Cliente creado exitosamente");
      setCreateDialogOpen(false);
      resetForm();
      onClientCreated?.();

    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(error.message || "Error al crear cliente");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  // Filter to active clients only
  const activeClients = clients.filter(c => c.status === 'active');

  const sortedClients = [...activeClients].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'name':
        return dir * a.contact_name.localeCompare(b.contact_name);
      case 'company':
        const compA = a.companies?.name || '';
        const compB = b.companies?.name || '';
        return dir * compA.localeCompare(compB);
      case 'email':
        return dir * (a.email || '').localeCompare(b.email || '');
      case 'events':
        return dir * ((a.events?.length || 0) - (b.events?.length || 0));
      case 'status':
        return dir * a.status.localeCompare(b.status);
      case 'created':
        return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return 0;
    }
  });

  const stats = {
    total: activeClients.length,
    withEvents: activeClients.filter(c => c.events?.length > 0).length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">Activo</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Archivado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <StatsCard value={stats.total} label="Total Clientes" valueColor="text-primary" />
        <StatsCard value={stats.withEvents} label="Con Eventos" valueColor="text-emerald-500" />
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Clientes
          </CardTitle>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Crear Cliente
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : activeClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No hay clientes registrados</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primer cliente
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHeader column="name" label="Nombre" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="company" label="Empresa" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="email" label="Email" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <TableHead>Teléfono</TableHead>
                    <SortableTableHeader column="events" label="Eventos" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="status" label="Estado" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/client/${client.id}`)}
                    >
                      <TableCell className="font-medium">{client.contact_name}</TableCell>
                      <TableCell>
                        {client.companies?.name ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                            {client.companies.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.email || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {client.phone || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{client.events?.length || 0}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Client Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Crear Nuevo Cliente</DialogTitle>
                <DialogDescription className="mt-1">
                  Agrega un nuevo cliente a tu CRM
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-5">
            {/* Client Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipo de Cliente</Label>
              <RadioGroup
                value={formData.clientType}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  clientType: value as "couple" | "wedding_planner",
                  companyId: value === "couple" ? "" : prev.companyId,
                  newCompanyName: value === "couple" ? "" : prev.newCompanyName,
                }))}
                className="grid grid-cols-2 gap-3"
              >
                <label
                  htmlFor="create-type-couple"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.clientType === "couple"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                >
                  <RadioGroupItem value="couple" id="create-type-couple" />
                  <div>
                    <p className="font-medium">Pareja</p>
                    <p className="text-xs text-muted-foreground">Cliente directo</p>
                  </div>
                </label>
                <label
                  htmlFor="create-type-planner"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.clientType === "wedding_planner"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                >
                  <RadioGroupItem value="wedding_planner" id="create-type-planner" />
                  <div>
                    <p className="font-medium">Wedding Planner</p>
                    <p className="text-xs text-muted-foreground">Con empresa</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="create-clientName" className="text-sm font-medium">Nombre del Contacto *</Label>
              <Input
                id="create-clientName"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="ej., Ana García"
                className="h-11"
              />
            </div>

            {/* Client Email & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-clientEmail" className="text-sm font-medium">Email</Label>
                <Input
                  id="create-clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="email@ejemplo.com"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-clientPhone" className="text-sm font-medium">Teléfono</Label>
                <Input
                  id="create-clientPhone"
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  placeholder="+52 55 1234 5678"
                  className="h-11"
                />
              </div>
            </div>

            {/* Company - Only for wedding planners */}
            {formData.clientType === "wedding_planner" && (
              <div className="space-y-2 p-4 bg-muted/30 rounded-xl">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Empresa
                </Label>
                {!showNewCompanyInput ? (
                  <div className="flex gap-2">
                    <Select
                      value={formData.companyId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}
                    >
                      <SelectTrigger className="flex-1 h-11">
                        <SelectValue placeholder="Seleccionar empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11"
                      onClick={() => {
                        setShowNewCompanyInput(true);
                        setFormData(prev => ({ ...prev, companyId: "" }));
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={formData.newCompanyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, newCompanyName: e.target.value }))}
                      placeholder="Nombre de la nueva empresa"
                      className="flex-1 h-11"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewCompanyInput(false);
                        setFormData(prev => ({ ...prev, newCompanyName: "" }));
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isCreating} className="h-11">
              Cancelar
            </Button>
            <Button onClick={handleCreateClient} disabled={isCreating} className="h-11 px-6">
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Cliente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
