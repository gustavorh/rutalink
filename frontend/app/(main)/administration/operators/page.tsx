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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Building2,
  CheckCircle,
  Shield,
  FileText,
} from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableAction,
} from "@/components/ui/data-table";
import { useFilters } from "@/lib/hooks/use-filters";
import { EmptyState } from "@/components/ui/empty-state";
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
  const {
    filters: filterState,
    setFilter,
    showFilters,
    toggleFilters,
    clearFilters: clearAllFilters,
  } = useFilters({
    initialFilters: {
      status: "all",
      super: "all",
    },
  });

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

  // Last update timestamp
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchOperators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterState.status, filterState.super]);

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
      if (filterState.status !== "all")
        params.status = filterState.status === "active" ? true : false;
      if (filterState.super !== "all")
        params.super = filterState.super === "super" ? true : false;

      const response = await api.operators.list(params);
      setOperators(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
      setLastUpdate(new Date());
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

  const handleClearFilters = () => {
    setSearch("");
    clearAllFilters();
    setPage(1);
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

        {/* Define table columns */}
        {(() => {
          const columns: DataTableColumn<Operator>[] = [
            {
              key: "name",
              header: "Nombre",
              accessor: (operator) => (
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
              ),
            },
            {
              key: "rut",
              header: "RUT",
              accessor: (operator) => (
                <div className="text-sm">
                  {operator.rut || (
                    <span className="text-muted-foreground text-xs">
                      Sin RUT
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: "expiration",
              header: "Expiración",
              accessor: (operator) => (
                <div className="text-sm">
                  {operator.expiration ? (
                    <div>
                      {new Date(operator.expiration).toLocaleDateString(
                        "es-ES"
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Sin expiración
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: "type",
              header: "Tipo",
              accessor: (operator) =>
                operator.super ? (
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
                ),
            },
            {
              key: "status",
              header: "Estado",
              accessor: (operator) => (
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
              ),
            },
          ];

          // Define table actions
          const actions: DataTableAction<Operator>[] = [
            {
              label: "Ver detalles",
              icon: <Eye className="h-4 w-4" />,
              onClick: (operator) =>
                router.push(`/administration/operators/${operator.id}`),
              className:
                "text-muted-foreground hover:text-primary hover:bg-primary/10",
              title: "Ver detalles",
            },
            {
              label: "Editar",
              icon: <Edit className="h-4 w-4" />,
              onClick: handleEditClick,
              className:
                "text-muted-foreground hover:text-secondary hover:bg-secondary/10",
              title: "Editar",
            },
            {
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: handleDeleteClick,
              className:
                "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              title: "Eliminar",
            },
          ];

          // Define filters
          const filters: DataTableFilter[] = [
            {
              id: "status-filter",
              label: "Estado",
              type: "select",
              value: filterState.status,
              onChange: (value) => setFilter("status", value),
              options: [
                { value: "all", label: "Todos los estados" },
                { value: "active", label: "Activo" },
                { value: "inactive", label: "Inactivo" },
              ],
              ariaLabel: "Filtrar por estado de la organización",
            },
            {
              id: "super-filter",
              label: "Tipo",
              type: "select",
              value: filterState.super,
              onChange: (value) => setFilter("super", value),
              options: [
                { value: "all", label: "Todos los tipos" },
                { value: "super", label: "Super Admin" },
                { value: "standard", label: "Estándar" },
              ],
              ariaLabel: "Filtrar por tipo de organización",
            },
          ];

          return (
            <DataTable
              data={operators}
              columns={columns}
              pagination={pagination}
              onPageChange={setPage}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre, contacto, ciudad..."
              onSearchSubmit={handleSearch}
              filters={filters}
              showFilters={showFilters}
              onToggleFilters={toggleFilters}
              onClearFilters={handleClearFilters}
              actions={actions}
              loading={loading}
              error={error}
              lastUpdate={lastUpdate}
              onRefresh={fetchOperators}
              onExport={() => {
                /* TODO: Implement export functionality */
              }}
              title="Listado de Organizaciones"
              description={`Total de ${total} organizaciones registradas`}
              icon={<FileText className="w-5 h-5 text-primary" />}
              getRowKey={(operator) => operator.id}
              emptyState={
                <EmptyState
                  icon={<Building2 className="w-12 h-12 text-slate-600" />}
                  title="No se encontraron organizaciones"
                  actionLabel={
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Primera Organización
                    </>
                  }
                  onAction={handleCreateClick}
                />
              }
            />
          );
        })()}
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
