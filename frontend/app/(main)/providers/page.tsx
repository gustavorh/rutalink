"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser } from "@/lib/auth";
import { api } from "@/lib/client-api";
import type { Provider } from "@/types/providers";
import type {
  CreateProviderDto,
  UpdateProviderDto,
  ProviderQueryDto,
} from "@/lib/api-types";
import { BUSINESS_TYPES } from "@/types/providers";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  CheckCircle,
  TrendingUp,
  Truck,
  FileText,
  Star,
} from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { StatisticsCard } from "@/components/ui/statistics-card";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormSection } from "@/components/ui/form-section";
import { usePagination } from "@/lib/hooks/use-pagination";
import { useFilters } from "@/lib/hooks/use-filters";
import {
  DataTable,
  DataTableColumn,
  DataTableFilter,
  DataTableAction,
} from "@/components/ui/data-table";

export default function ProvidersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(
    null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState<Provider | null>(null);
  const [formData, setFormData] = useState<
    CreateProviderDto | UpdateProviderDto
  >({
    businessName: "",
    taxId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    region: "",
    country: "Chile",
    businessType: undefined,
    serviceTypes: "",
    fleetSize: undefined,
    status: true,
    rating: undefined,
    observations: "",
    notes: "",
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
      businessType: "all",
    },
  });

  // Pagination
  const { page, setPage, total, setTotal, setTotalPages, pagination } =
    usePagination({ initialLimit: 10 });

  // Last update timestamp
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterState.status, filterState.businessType]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const params: ProviderQueryDto = {
        operatorId: user.operatorId,
        page,
        limit: pagination.limit,
      };

      if (search) params.search = search;
      if (filterState.status !== "all")
        params.status = filterState.status === "active" ? true : false;
      if (filterState.businessType !== "all")
        params.businessType = filterState.businessType;

      const response = await api.providers.list(params);
      setProviders(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
      setLastUpdate(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar proveedores"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchProviders();
  };

  const handleDeleteClick = (provider: Provider) => {
    setProviderToDelete(provider);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!providerToDelete) return;

    try {
      await api.providers.delete(providerToDelete.id);
      setDeleteDialogOpen(false);
      setProviderToDelete(null);
      fetchProviders();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar proveedor"
      );
    }
  };

  const handleCreateClick = () => {
    const user = getUser();
    if (!user) return;

    setFormData({
      businessName: "",
      taxId: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      city: "",
      region: "",
      country: "Chile",
      businessType: undefined,
      serviceTypes: "",
      fleetSize: undefined,
      status: true,
      rating: undefined,
      observations: "",
      notes: "",
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (provider: Provider) => {
    setProviderToEdit(provider);
    setFormData({
      businessName: provider.businessName,
      taxId: provider.taxId || "",
      contactName: provider.contactName || "",
      contactEmail: provider.contactEmail || "",
      contactPhone: provider.contactPhone || "",
      address: provider.address || "",
      city: provider.city || "",
      region: provider.region || "",
      country: provider.country || "Chile",
      businessType: (provider.businessType || undefined) as
        | (typeof BUSINESS_TYPES)[number]["value"]
        | undefined,
      serviceTypes: provider.serviceTypes || "",
      fleetSize: provider.fleetSize || undefined,
      status: provider.status,
      rating: provider.rating || undefined,
      observations: provider.observations || "",
      notes: provider.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getUser();
    if (!user) return;

    try {
      setFormLoading(true);
      setError(null);

      if (editDialogOpen && providerToEdit) {
        // Update existing provider
        await api.providers.update(
          providerToEdit.id,
          formData as UpdateProviderDto
        );
        setEditDialogOpen(false);
        setProviderToEdit(null);
      } else {
        // Create new provider
        const createData: CreateProviderDto = {
          ...(formData as CreateProviderDto),
          operatorId: user.operatorId,
        };
        await api.providers.create(createData);
        setCreateDialogOpen(false);
      }

      fetchProviders();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar proveedor"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const getBusinessTypeLabel = (businessType?: string | null) => {
    if (!businessType) return "N/A";
    const found = BUSINESS_TYPES.find((t) => t.value === businessType);
    return found ? found.label : businessType;
  };

  // Table Columns Configuration
  const tableColumns: DataTableColumn<Provider>[] = [
    {
      key: "businessName",
      header: "Razón Social",
      accessor: (provider) => (
        <div>
          <div className="font-medium text-foreground">
            {provider.businessName}
          </div>
          {provider.observations && (
            <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
              {provider.observations}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "taxId",
      header: "RUT",
      accessor: (provider) => (
        <span className="font-mono text-sm text-foreground">
          {provider.taxId || "N/A"}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contacto",
      accessor: (provider) => (
        <div className="text-sm space-y-1">
          {provider.contactName && (
            <div className="text-foreground">{provider.contactName}</div>
          )}
          {provider.contactEmail && (
            <div className="text-muted-foreground text-xs">
              {provider.contactEmail}
            </div>
          )}
          {provider.contactPhone && (
            <div className="text-muted-foreground text-xs">
              {provider.contactPhone}
            </div>
          )}
          {!provider.contactName &&
            !provider.contactEmail &&
            !provider.contactPhone && (
              <div className="text-muted-foreground text-xs">Sin contacto</div>
            )}
        </div>
      ),
    },
    {
      key: "location",
      header: "Ubicación",
      accessor: (provider) => (
        <div className="text-sm space-y-1">
          {provider.city && (
            <div className="text-foreground">{provider.city}</div>
          )}
          {provider.region && (
            <div className="text-muted-foreground text-xs">
              {provider.region}
            </div>
          )}
          {!provider.city && !provider.region && (
            <div className="text-muted-foreground text-xs">N/A</div>
          )}
        </div>
      ),
    },
    {
      key: "businessType",
      header: "Tipo de Servicio",
      accessor: (provider) =>
        provider.businessType ? (
          <Badge variant="outline" className="border-primary/50 text-primary">
            {getBusinessTypeLabel(provider.businessType)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Sin clasificar</span>
        ),
    },
    {
      key: "fleetSize",
      header: "Flota",
      accessor: (provider) =>
        provider.fleetSize ? (
          <div className="text-foreground font-medium">
            {provider.fleetSize} vehículos
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">N/A</span>
        ),
    },
    {
      key: "rating",
      header: "Calificación",
      accessor: (provider) =>
        provider.rating ? (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-warning fill-warning" />
            <span className="text-foreground font-medium">
              {provider.rating}
            </span>
            <span className="text-muted-foreground text-xs">/ 5</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">Sin calificar</span>
        ),
    },
    {
      key: "status",
      header: "Estado",
      accessor: (provider) => (
        <Badge
          variant={provider.status ? "default" : "outline"}
          className={
            provider.status
              ? "bg-success/10 text-success border-success/50"
              : "border-slate-500/50 text-muted-foreground"
          }
        >
          {provider.status ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  // Table Filters Configuration
  const tableFilters: DataTableFilter[] = [
    {
      id: "status",
      label: "Estado",
      type: "select",
      value: filterState.status,
      onChange: (value) => setFilter("status", value),
      placeholder: "Estado",
      options: [
        { value: "all", label: "Todos los estados" },
        { value: "active", label: "Activo" },
        { value: "inactive", label: "Inactivo" },
      ],
    },
    {
      id: "businessType",
      label: "Tipo de Servicio",
      type: "select",
      value: filterState.businessType,
      onChange: (value) => setFilter("businessType", value),
      placeholder: "Tipo de servicio",
      options: [
        { value: "all", label: "Todos los tipos" },
        ...BUSINESS_TYPES.map((type) => ({
          value: type.value,
          label: type.label,
        })),
      ],
    },
  ];

  // Table Actions Configuration
  const tableActions: DataTableAction<Provider>[] = [
    {
      label: "Editar",
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditClick,
      variant: "ghost",
      className: "text-primary hover:text-primary-dark",
    },
    {
      label: "Eliminar",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteClick,
      variant: "ghost",
      className: "text-destructive hover:text-red-700",
    },
  ];

  // Row click handler
  const handleRowClick = (provider: Provider) => {
    router.push(`/providers/${provider.id}`);
  };

  if (!mounted) {
    return <LoadingState />;
  }

  const user = getUser();
  if (!user) {
    return null;
  }

  // Calculate statistics
  const activeProviders = providers.filter((p) => p.status).length;
  const providersByType = providers.reduce((acc, provider) => {
    const type = provider.businessType || "Sin clasificar";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topType = Object.entries(providersByType).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const avgRating =
    providers.filter((p) => p.rating).length > 0
      ? (
          providers.reduce((sum, p) => sum + (p.rating || 0), 0) /
          providers.filter((p) => p.rating).length
        ).toFixed(1)
      : "N/A";

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Mantenedor de Proveedores de Transporte"
          description="Gestión de proveedores externos y servicios de transporte"
          icon={<Truck className="w-6 h-6" />}
          actionLabel={
            <>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </>
          }
          onAction={handleCreateClick}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatisticsCard
            value={total}
            label="Total Proveedores"
            icon={<Building2 className="w-6 h-6" />}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
          />
          <StatisticsCard
            value={activeProviders}
            label="Proveedores Activos"
            icon={<CheckCircle className="w-6 h-6" />}
            iconBgColor="bg-success/10"
            iconColor="text-success"
          />
          <StatisticsCard
            value={avgRating !== "N/A" ? `${avgRating} / 5` : avgRating}
            label="Calificación Promedio"
            icon={<Star className="w-6 h-6" />}
            iconBgColor="bg-warning/10"
            iconColor="text-warning"
          />
          <StatisticsCard
            value={
              topType
                ? `${getBusinessTypeLabel(topType[0])} (${topType[1]})`
                : "N/A"
            }
            label="Tipo Principal"
            icon={<TrendingUp className="w-6 h-6" />}
            iconBgColor="bg-secondary/10"
            iconColor="text-secondary"
          />
        </div>

        {/* Data Table */}
        <DataTable
          data={providers}
          columns={tableColumns}
          pagination={pagination}
          onPageChange={setPage}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por razón social, RUT, contacto..."
          onSearchSubmit={handleSearch}
          filters={tableFilters}
          showFilters={showFilters}
          onToggleFilters={toggleFilters}
          onClearFilters={() => {
            setSearch("");
            clearAllFilters();
            setPage(1);
          }}
          actions={tableActions}
          onRowClick={handleRowClick}
          loading={loading}
          error={error}
          emptyState={
            <EmptyState
              icon={<Truck className="w-12 h-12 text-slate-600" />}
              title="No se encontraron proveedores"
              actionLabel={
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primer Proveedor
                </>
              }
              onAction={handleCreateClick}
            />
          }
          title={
            <>
              <FileText className="w-5 h-5 text-primary" />
              Listado de Proveedores
            </>
          }
          description={`Total de ${total} proveedores registrados`}
          lastUpdate={lastUpdate}
          onRefresh={fetchProviders}
          onExport={() => {
            /* TODO: Implement export functionality */
          }}
          getRowKey={(provider) => provider.id}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={providerToDelete?.businessName}
        itemType="proveedor"
      />

      {/* Create/Edit Provider Dialog */}
      <FormDialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setProviderToEdit(null);
          }
        }}
        title={editDialogOpen ? "Editar Proveedor" : "Nuevo Proveedor"}
        description={
          editDialogOpen
            ? "Actualiza la información del proveedor"
            : "Completa la información del nuevo proveedor"
        }
        onSubmit={handleFormSubmit}
        loading={formLoading}
        submitLabel={
          editDialogOpen ? "Actualizar Proveedor" : "Crear Proveedor"
        }
        maxWidth="2xl"
        onCancel={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setProviderToEdit(null);
        }}
      >
        <FormSection title="Información Comercial">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="businessName" className="text-foreground">
                Razón Social *
              </Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
                required
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: Transportes ABC S.A."
              />
            </div>

            <div>
              <Label htmlFor="taxId" className="text-foreground">
                RUT
              </Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) =>
                  setFormData({ ...formData, taxId: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: 76.123.456-7"
              />
            </div>

            <div>
              <Label htmlFor="businessType" className="text-foreground">
                Tipo de Servicio
              </Label>
              <Select
                value={formData.businessType || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    businessType:
                      value as (typeof BUSINESS_TYPES)[number]["value"],
                  })
                }
              >
                <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="serviceTypes" className="text-foreground">
                Servicios Ofrecidos
              </Label>
              <Input
                id="serviceTypes"
                value={formData.serviceTypes}
                onChange={(e) =>
                  setFormData({ ...formData, serviceTypes: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: Carga seca, refrigerada, contenedores"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separa los servicios con comas
              </p>
            </div>

            <div>
              <Label htmlFor="fleetSize" className="text-foreground">
                Tamaño de Flota
              </Label>
              <Input
                id="fleetSize"
                type="number"
                min="0"
                value={formData.fleetSize || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fleetSize: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Número de vehículos"
              />
            </div>

            <div>
              <Label htmlFor="rating" className="text-foreground">
                Calificación (1-5)
              </Label>
              <Input
                id="rating"
                type="number"
                min="1"
                max="5"
                value={formData.rating || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rating: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="1 a 5 estrellas"
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Información de Contacto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="contactName" className="text-foreground">
                Nombre de Contacto
              </Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) =>
                  setFormData({ ...formData, contactName: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <Label htmlFor="contactEmail" className="text-foreground">
                Email de Contacto
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData({ ...formData, contactEmail: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="contacto@empresa.cl"
              />
            </div>

            <div>
              <Label htmlFor="contactPhone" className="text-foreground">
                Teléfono de Contacto
              </Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, contactPhone: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Ubicación">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="address" className="text-foreground">
                Dirección
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: Av. Principal 123"
              />
            </div>

            <div>
              <Label htmlFor="city" className="text-foreground">
                Ciudad
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: Santiago"
              />
            </div>

            <div>
              <Label htmlFor="region" className="text-foreground">
                Región
              </Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: Metropolitana"
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Información Adicional">
          <div className="space-y-4">
            <div>
              <Label htmlFor="observations" className="text-foreground">
                Observaciones
              </Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) =>
                  setFormData({ ...formData, observations: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Observaciones generales del proveedor..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-foreground">
                Notas Internas
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Notas internas sobre el proveedor..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
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
                Proveedor Activo
              </Label>
            </div>
          </div>
        </FormSection>
      </FormDialog>
    </main>
  );
}
