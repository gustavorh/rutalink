"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser } from "@/lib/auth";
import { api } from "@/lib/client-api";
import type { Operator } from "@/types/operators";
import type {
  CreateOperatorDto,
  UpdateOperatorDto,
  OperatorQueryDto,
} from "@/lib/api-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Building2,
  AlertTriangle,
  CheckCircle,
  Filter,
  Download,
  Users,
  Shield,
} from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { StatisticsCard } from "@/components/ui/statistics-card";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormSection } from "@/components/ui/form-section";
import { usePagination } from "@/lib/hooks/use-pagination";

export default function OperatorsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(
    null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [operatorToEdit, setOperatorToEdit] = useState<Operator | null>(null);
  const [formData, setFormData] = useState<
    CreateOperatorDto | UpdateOperatorDto
  >({
    name: "",
    rut: "",
    super: false,
    expiration: "",
    status: true,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");

  // Pagination
  const {
    page,
    setPage,
    total,
    setTotal,
    totalPages,
    setTotalPages,
    pagination,
  } = usePagination({ initialLimit: 10 });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchOperators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const params: OperatorQueryDto = {
        page: page.toString(),
        limit: pagination.limit.toString(),
      };

      if (search) params.search = search;

      const response = await api.operators.list(params);
      setOperators(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar organizaciones"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOperators();
  };

  const handleDeleteClick = (operator: Operator) => {
    setOperatorToDelete(operator);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!operatorToDelete) return;

    try {
      await api.operators.delete(operatorToDelete.id);
      setDeleteDialogOpen(false);
      setOperatorToDelete(null);
      fetchOperators();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar organización"
      );
    }
  };

  const handleCreateClick = () => {
    setFormData({
      name: "",
      rut: "",
      super: false,
      expiration: "",
      status: true,
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (operator: Operator) => {
    setOperatorToEdit(operator);
    setFormData({
      name: operator.name,
      rut: operator.rut || "",
      super: operator.super,
      expiration: operator.expiration || "",
      status: operator.status,
    });
    setEditDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setError(null);

      if (editDialogOpen && operatorToEdit) {
        // Update existing operator
        await api.operators.update(
          operatorToEdit.id,
          formData as UpdateOperatorDto
        );
        setEditDialogOpen(false);
        setOperatorToEdit(null);
      } else {
        // Create new operator
        await api.operators.create(formData as CreateOperatorDto);
        setCreateDialogOpen(false);
      }

      fetchOperators();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar organización"
      );
    } finally {
      setFormLoading(false);
    }
  };

  if (!mounted) {
    return <LoadingState />;
  }

  const user = getUser();
  if (!user) {
    return null;
  }

  // Calculate statistics
  const activeOperators = operators.filter((o) => o.status).length;
  const superOperators = operators.filter((o) => o.super).length;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Gestión de Organizaciones"
          description="Administración de organizaciones multi-tenancy"
          icon={<Building2 className="w-6 h-6" />}
          actionLabel={
            <>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Organización
            </>
          }
          onAction={handleCreateClick}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatisticsCard
            value={total}
            label="Total Organizaciones"
            icon={<Building2 className="w-6 h-6" />}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
          />
          <StatisticsCard
            value={activeOperators}
            label="Organizaciones Activas"
            icon={<CheckCircle className="w-6 h-6" />}
            iconBgColor="bg-success/10"
            iconColor="text-success"
          />
          <StatisticsCard
            value={superOperators}
            label="Organizaciones Super"
            icon={<Shield className="w-6 h-6" />}
            iconBgColor="bg-orange-500/10"
            iconColor="text-orange-400"
          />
        </div>

        {/* Filters Card */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                Filtros de Búsqueda
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Filtra y busca organizaciones
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar - Always Visible */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, contacto, ciudad..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 bg-ui-surface-elevated border-border text-foreground placeholder-muted-foreground focus:border-primary"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="bg-primary hover:bg-primary-dark"
                >
                  Buscar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operators Table */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Listado de Organizaciones
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Total de {total} organizaciones registradas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-ui-surface-elevated"
                onClick={() => {
                  /* TODO: Implement export functionality */
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-muted-foreground mt-4">
                  Cargando organizaciones...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">{error}</p>
              </div>
            ) : operators.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron organizaciones
                </p>
                <Button
                  onClick={handleCreateClick}
                  className="mt-4 bg-primary hover:bg-primary-dark"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primera Organización
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">
                          Nombre
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          RUT
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Expiración
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Tipo
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Estado
                        </TableHead>
                        <TableHead className="text-right text-muted-foreground">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operators.map((operator) => (
                        <TableRow
                          key={operator.id}
                          className="border-b border-border hover:bg-ui-surface-elevated"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-foreground flex items-center gap-2">
                                {operator.name}
                                {operator.super && (
                                  <Shield className="w-4 h-4 text-orange-400" />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                ID: {operator.id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {operator.rut || (
                                <span className="text-muted-foreground text-xs">
                                  Sin RUT
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {operator.expiration ? (
                                <div>
                                  {new Date(
                                    operator.expiration
                                  ).toLocaleDateString("es-ES")}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  Sin expiración
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {operator.super ? (
                              <Badge
                                variant="outline"
                                className="border-orange-500/50 text-orange-400"
                              >
                                Super Admin
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-primary/50 text-primary"
                              >
                                Estándar
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={operator.status ? "default" : "outline"}
                              className={
                                operator.status
                                  ? "bg-success/10 text-success border-success/50"
                                  : "border-slate-500/50 text-muted-foreground"
                              }
                            >
                              {operator.status ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  router.push(
                                    `/administration/operators/${operator.id}`
                                  )
                                }
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(operator)}
                                className="text-muted-foreground hover:text-secondary hover:bg-secondary/10"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(operator)}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    de {pagination.total} organizaciones
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="border-border text-foreground hover:bg-ui-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= page - 1 && p <= page + 1)
                      )
                      .map((p, index, array) => (
                        <div key={p} className="flex items-center">
                          {index > 0 && array[index - 1] !== p - 1 && (
                            <span className="text-muted-foreground px-2">
                              ...
                            </span>
                          )}
                          <Button
                            variant={p === page ? "default" : "outline"}
                            onClick={() => setPage(p)}
                            className={
                              p === page
                                ? "bg-primary hover:bg-primary-dark text-white"
                                : "border-border text-foreground hover:bg-ui-surface-elevated"
                            }
                          >
                            {p}
                          </Button>
                        </div>
                      ))}
                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="border-border text-foreground hover:bg-ui-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={operatorToDelete?.name}
        itemType="organización"
        description={`¿Estás seguro de que deseas eliminar la organización ${operatorToDelete?.name}? Esta acción marcará la organización como inactiva.`}
      />

      {/* Create/Edit Operator Dialog */}
      <FormDialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setOperatorToEdit(null);
          }
        }}
        title={editDialogOpen ? "Editar Organización" : "Nueva Organización"}
        description={
          editDialogOpen
            ? "Actualiza la información de la organización"
            : "Completa la información de la nueva organización"
        }
        onSubmit={handleFormSubmit}
        loading={formLoading}
        submitLabel={
          editDialogOpen ? "Actualizar Organización" : "Crear Organización"
        }
        maxWidth="2xl"
        onCancel={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setOperatorToEdit(null);
        }}
      >
        <FormSection title="Información Básica">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name" className="text-foreground">
                Nombre de la Organización *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: Transporte ABC Ltda."
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="rut" className="text-foreground">
                RUT
              </Label>
              <Input
                id="rut"
                value={formData.rut}
                onChange={(e) =>
                  setFormData({ ...formData, rut: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="12.345.678-9"
                maxLength={12}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formato: 12.345.678-9
              </p>
            </div>

            <div className="col-span-2">
              <Label htmlFor="expiration" className="text-foreground">
                Fecha de Expiración
              </Label>
              <Input
                id="expiration"
                type="date"
                value={formData.expiration || ""}
                onChange={(e) =>
                  setFormData({ ...formData, expiration: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Fecha límite de operación de la organización
              </p>
            </div>

            <div className="col-span-2 flex items-center space-x-2">
              <input
                type="checkbox"
                id="super"
                checked={formData.super}
                onChange={(e) =>
                  setFormData({ ...formData, super: e.target.checked })
                }
                className="rounded border-border bg-ui-surface-elevated text-primary focus:ring-blue-500"
              />
              <Label htmlFor="super" className="text-foreground cursor-pointer">
                Organización Super (acceso completo al sistema)
              </Label>
            </div>

            <div className="col-span-2 flex items-center space-x-2">
              <input
                type="checkbox"
                id="status"
                checked={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.checked })
                }
                className="rounded border-border bg-ui-surface-elevated text-primary focus:ring-blue-500"
              />
              <Label
                htmlFor="status"
                className="text-foreground cursor-pointer"
              >
                Organización Activa
              </Label>
            </div>
          </div>
        </FormSection>
      </FormDialog>
    </main>
  );
}
