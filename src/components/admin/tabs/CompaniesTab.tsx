import { useState, useEffect } from "react";
import { Building2, Loader2, Plus, Pencil, Trash2, Users, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SortableTableHeader } from "../shared/SortableTableHeader";
import { StatsCard } from "../shared/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CompanyContact {
  id: string;
  contact_name: string;
}

interface Company {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  contacts: CompanyContact[];
}

type SortColumn = 'name' | 'notes' | 'contacts' | 'created';

export const CompaniesTab = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Sort state
  const [sortBy, setSortBy] = useState<SortColumn>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", notes: "" });

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState({ name: "", notes: "" });

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

  const toggleRow = (companyId: string) => {
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
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort
  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'name':
        return dir * a.name.localeCompare(b.name);
      case 'notes':
        return dir * (a.notes || '').localeCompare(b.notes || '');
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
      .insert({
        name: createForm.name.trim(),
        notes: createForm.notes.trim() || null,
      });

    if (error) {
      console.error(error);
      toast.error("Error al crear empresa");
    } else {
      toast.success("Empresa creada exitosamente");
      setCreateDialogOpen(false);
      setCreateForm({ name: "", notes: "" });
      await loadCompanies();
    }
    setIsCreating(false);
  };

  // Edit
  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setEditForm({ name: company.name, notes: company.notes || "" });
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
      .update({
        name: editForm.name.trim(),
        notes: editForm.notes.trim() || null,
      })
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
  const openDelete = (company: Company) => {
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
              placeholder="Buscar empresa..."
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
                    <SortableTableHeader column="notes" label="Notas" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="contacts" label="Contactos" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTableHeader column="created" label="Creado" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCompanies.map((company) => {
                    const isExpanded = expandedRows.has(company.id);
                    const contactCount = company.contacts?.length || 0;

                    return (
                      <>
                        <TableRow key={company.id} className="hover:bg-muted/50">
                          <TableCell className="w-8 pr-0">
                            {contactCount > 0 && (
                              <button
                                onClick={() => toggleRow(company.id)}
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
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell className="max-w-[200px]">
                            {company.notes ? (
                              <span className="truncate block" title={company.notes}>
                                {company.notes}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
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
                                onClick={() => openEdit(company)}
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => openDelete(company)}
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
                            <TableCell colSpan={6} className="py-3 px-8">
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
        if (!open) setCreateForm({ name: "", notes: "" });
      }}>
        <DialogContent className="max-w-lg">
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

          <div className="space-y-5 py-5">
            <div className="space-y-2">
              <Label htmlFor="create-company-name" className="text-sm font-medium">Nombre *</Label>
              <Input
                id="create-company-name"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ej., Wedding Dreams S.A."
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-company-notes" className="text-sm font-medium">Notas</Label>
              <Textarea
                id="create-company-notes"
                value={createForm.notes}
                onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales sobre la empresa..."
                rows={3}
              />
            </div>
          </div>

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
        <DialogContent className="max-w-lg">
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

          <div className="space-y-5 py-5">
            <div className="space-y-2">
              <Label htmlFor="edit-company-name" className="text-sm font-medium">Nombre *</Label>
              <Input
                id="edit-company-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre de la empresa"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company-notes" className="text-sm font-medium">Notas</Label>
              <Textarea
                id="edit-company-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>
          </div>

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
