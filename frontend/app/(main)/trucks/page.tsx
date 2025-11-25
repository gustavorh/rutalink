"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser } from "@/lib/auth";
import { api } from "@/lib/client-api";
import type { Truck } from "@/types/trucks";
import type {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleQueryDto,
} from "@/lib/api-types";
import {
  VEHICLE_TYPES,
  OPERATIONAL_STATUS,
  VehicleType,
  CapacityUnit,
  CAPACITY_UNITS,
} from "@/types/trucks";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableAction,
  type PaginationInfo,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  Truck as TruckIcon,
  CheckCircle,
  Clock,
  Wrench,
  XCircle,
  Save,
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

export default function TrucksPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [truckToDelete, setTruckToDelete] = useState<Truck | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [truckToEdit, setTruckToEdit] = useState<Truck | null>(null);
  const [formData, setFormData] = useState<CreateVehicleDto | UpdateVehicleDto>(
    {
      plateNumber: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      vehicleType: VehicleType.TRUCK,
      capacity: undefined,
      capacityUnit: CapacityUnit.TONS,
      vin: "",
      color: "",
      status: true,
      notes: "",
    }
  );
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
      vehicleType: "all",
      operationalStatus: "all",
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
    fetchTrucks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    search,
    filterState.status,
    filterState.vehicleType,
    filterState.operationalStatus,
  ]);

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const params: VehicleQueryDto = {
        page,
        limit: pagination.limit,
        includeStats: true,
      };

      if (search) params.search = search;
      if (filterState.status !== "all")
        params.status = filterState.status === "active" ? true : false;
      if (filterState.vehicleType !== "all") {
        params.vehicleType =
          filterState.vehicleType as VehicleQueryDto["vehicleType"];
      }
      if (filterState.operationalStatus !== "all") {
        params.operationalStatus =
          filterState.operationalStatus as VehicleQueryDto["operationalStatus"];
      }

      const response = await api.vehicles.list(params);
      setTrucks(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar camiones");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchTrucks();
  };

  const handleDeleteClick = (truck: Truck) => {
    setTruckToDelete(truck);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!truckToDelete) return;

    try {
      await api.vehicles.delete(truckToDelete.id);
      setDeleteDialogOpen(false);
      setTruckToDelete(null);
      fetchTrucks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar camión");
    }
  };

  const handleCreateClick = () => {
    setFormData({
      plateNumber: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      vehicleType: VehicleType.TRUCK,
      capacity: undefined,
      capacityUnit: CapacityUnit.TONS,
      vin: "",
      color: "",
      status: true,
      notes: "",
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = async (truck: Truck) => {
    setTruckToEdit(truck);
    setFormData({
      plateNumber: truck.plateNumber,
      brand: truck.brand,
      model: truck.model,
      year: truck.year,
      vehicleType: truck.vehicleType,
      capacity: truck.capacity,
      capacityUnit: truck.capacityUnit,
      vin: truck.vin,
      color: truck.color,
      status: truck.status,
      notes: truck.notes,
    });
    setEditDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setError(null);

      if (editDialogOpen && truckToEdit) {
        await api.vehicles.update(truckToEdit.id, formData as UpdateVehicleDto);
        setEditDialogOpen(false);
        setTruckToEdit(null);
      } else {
        await api.vehicles.create(formData as CreateVehicleDto);
        setCreateDialogOpen(false);
      }

      fetchTrucks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar camión");
    } finally {
      setFormLoading(false);
    }
  };

  const handleChange = (
    field: keyof CreateVehicleDto,
    value: string | number | boolean | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getVehicleTypeLabel = (type: string) => {
    return VEHICLE_TYPES.find((vt) => vt.value === type)?.label || type;
  };

  const getOperationalStatusInfo = (status?: string) => {
    if (!status) return OPERATIONAL_STATUS[0];
    return (
      OPERATIONAL_STATUS.find((s) => s.value === status) ||
      OPERATIONAL_STATUS[0]
    );
  };

  if (!mounted) {
    return <LoadingState />;
  }

  const user = getUser();
  if (!user) {
    return null;
  }

  // Calculate statistics
  const activeTrucks = trucks.filter((t) => t.status).length;
  const inMaintenanceTrucks = trucks.filter(
    (t) => t.operationalStatus === "maintenance"
  ).length;
  const totalUpcomingOperations = trucks.reduce(
    (sum, t) => sum + (t.upcomingOperations || 0),
    0
  );

  // Define table columns
  const columns: DataTableColumn<Truck>[] = [
    {
      key: "plateNumber",
      header: "Patente",
      accessor: (truck) => (
        <span className="font-mono text-sm font-bold">{truck.plateNumber}</span>
      ),
    },
    {
      key: "brand",
      header: "Marca / Modelo",
      accessor: (truck) => (
        <div>
          <div className="font-medium text-foreground">
            {truck.brand || "N/A"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {truck.model || "Sin modelo"}
          </div>
        </div>
      ),
    },
    {
      key: "year",
      header: "Año",
      accessor: (truck) => (
        <span className="text-foreground">{truck.year || "N/A"}</span>
      ),
    },
    {
      key: "vehicleType",
      header: "Tipo",
      accessor: (truck) => (
        <Badge variant="outline" className="border-primary/50 text-primary">
          {getVehicleTypeLabel(truck.vehicleType)}
        </Badge>
      ),
    },
    {
      key: "capacity",
      header: "Capacidad",
      accessor: (truck) => (
        <span className="text-foreground">
          {truck.capacity
            ? `${truck.capacity} ${truck.capacityUnit || ""}`
            : "N/A"}
        </span>
      ),
    },
    {
      key: "operationalStatus",
      header: "Estado Operativo",
      accessor: (truck) => {
        const opStatus = getOperationalStatusInfo(truck.operationalStatus);
        return (
          <div className="flex items-center gap-2">
            {opStatus.color === "green" && (
              <CheckCircle className="w-4 h-4 text-success" />
            )}
            {opStatus.color === "yellow" && (
              <Wrench className="w-4 h-4 text-warning" />
            )}
            {opStatus.color === "red" && (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
            {opStatus.color === "blue" && (
              <Clock className="w-4 h-4 text-primary" />
            )}
            <Badge
              variant="outline"
              className={`border-${opStatus.color}-500/50 text-${opStatus.color}-400`}
            >
              {opStatus.label}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "operations",
      header: "Operaciones",
      accessor: (truck) => (
        <div className="text-sm space-y-1">
          <div className="text-foreground">
            Total: {truck.totalOperations || 0}
          </div>
          <div className="text-muted-foreground">
            Próximas: {truck.upcomingOperations || 0}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      accessor: (truck) => (
        <Badge
          variant={truck.status ? "default" : "outline"}
          className={
            truck.status
              ? "bg-success/10 text-success border-success/50"
              : "border-slate-500/50 text-muted-foreground"
          }
        >
          {truck.status ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  // Define table actions
  const actions: DataTableAction<Truck>[] = [
    {
      label: "Ver detalles",
      icon: <Eye className="h-4 w-4" />,
      onClick: (truck) => router.push(`/trucks/${truck.id}`),
      className: "text-muted-foreground hover:text-primary hover:bg-primary/10",
      title: "Ver detalles",
    },
    {
      label: "Editar",
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditClick,
      className: "text-muted-foreground hover:text-primary hover:bg-primary/10",
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
      ariaLabel: "Filtrar por estado del camión",
    },
    {
      id: "vehicle-type-filter",
      label: "Tipo de Vehículo",
      type: "select",
      value: filterState.vehicleType,
      onChange: (value) => setFilter("vehicleType", value),
      options: [
        { value: "all", label: "Todos los tipos" },
        ...VEHICLE_TYPES.map((type) => ({
          value: type.value,
          label: type.label,
        })),
      ],
      ariaLabel: "Filtrar por tipo de vehículo",
    },
    {
      id: "operational-status-filter",
      label: "Estado Operativo",
      type: "select",
      value: filterState.operationalStatus,
      onChange: (value) => setFilter("operationalStatus", value),
      options: [
        { value: "all", label: "Todos" },
        ...OPERATIONAL_STATUS.map((status) => ({
          value: status.value,
          label: status.label,
        })),
      ],
      ariaLabel: "Filtrar por estado operativo",
    },
  ];

  const handleClearFilters = () => {
    setSearch("");
    clearAllFilters();
    setPage(1);
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Mantenedor de Camiones"
          description="Gestión de flota de camiones y documentación"
          icon={<TruckIcon className="w-6 h-6" />}
          actionLabel={
            <>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Camión
            </>
          }
          onAction={handleCreateClick}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatisticsCard
            value={total}
            label="Total Camiones"
            icon={<TruckIcon className="w-6 h-6" />}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
          />
          <StatisticsCard
            value={activeTrucks}
            label="Activos"
            icon={<CheckCircle className="w-6 h-6" />}
            iconBgColor="bg-success/10"
            iconColor="text-success"
          />
          <StatisticsCard
            value={inMaintenanceTrucks}
            label="En Mantenimiento"
            icon={<Wrench className="w-6 h-6" />}
            iconBgColor="bg-warning/10"
            iconColor="text-warning"
            valueColor="text-warning"
          />
          <StatisticsCard
            value={totalUpcomingOperations}
            label="Operaciones Próximas"
            icon={<Clock className="w-6 h-6" />}
            iconBgColor="bg-secondary/10"
            iconColor="text-secondary"
          />
        </div>

        {/* Data Table with Integrated Filters */}
        <DataTable
          data={trucks}
          columns={columns}
          actions={actions}
          pagination={pagination}
          onPageChange={setPage}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por patente, marca, modelo..."
          onSearchSubmit={handleSearch}
          filters={filters}
          showFilters={showFilters}
          onToggleFilters={toggleFilters}
          onClearFilters={handleClearFilters}
          loading={loading}
          error={error}
          title="Listado de Camiones"
          description={`Total de ${total} camiones registrados`}
          icon={<FileText className="w-5 h-5 text-primary" />}
          lastUpdate={lastUpdate}
          onRefresh={fetchTrucks}
          onExport={() => {
            /* TODO: Implement export functionality */
          }}
          getRowKey={(truck) => truck.id}
          emptyState={
            <EmptyState
              icon={<TruckIcon className="w-12 h-12 text-slate-600" />}
              title="No se encontraron camiones"
              actionLabel={
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primer Camión
                </>
              }
              onAction={handleCreateClick}
            />
          }
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={truckToDelete?.plateNumber}
        itemType="camión"
      />

      {/* Create/Edit Truck Dialog */}
      <FormDialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setTruckToEdit(null);
          }
        }}
        title={editDialogOpen ? "Editar Camión" : "Nuevo Camión"}
        description={
          editDialogOpen
            ? "Actualiza la información del camión"
            : "Completa los datos del nuevo camión"
        }
        onSubmit={handleFormSubmit}
        loading={formLoading}
        submitLabel={editDialogOpen ? "Guardar Cambios" : "Guardar Camión"}
        maxWidth="4xl"
        onCancel={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setTruckToEdit(null);
        }}
      >
        <FormSection title="Información del Camión">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plateNumber" className="text-foreground">
                Patente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="plateNumber"
                value={formData.plateNumber}
                onChange={(e) =>
                  handleChange("plateNumber", e.target.value.toUpperCase())
                }
                placeholder="AB-1234"
                required
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
              />
            </div>

            <div>
              <Label htmlFor="vehicleType" className="text-foreground">
                Tipo de Vehículo <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.vehicleType}
                onValueChange={(value) =>
                  handleChange("vehicleType", value as VehicleType)
                }
              >
                <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="brand" className="text-foreground">
                Marca
              </Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                placeholder="Mercedes-Benz, Volvo, etc."
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
              />
            </div>

            <div>
              <Label htmlFor="model" className="text-foreground">
                Modelo
              </Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleChange("model", e.target.value)}
                placeholder="Actros, FH16, etc."
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
              />
            </div>

            <div>
              <Label htmlFor="year" className="text-foreground">
                Año
              </Label>
              <Input
                id="year"
                type="number"
                value={formData.year || ""}
                onChange={(e) =>
                  handleChange("year", parseInt(e.target.value) || undefined)
                }
                min="1900"
                max={new Date().getFullYear() + 1}
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
              />
            </div>

            <div>
              <Label htmlFor="color" className="text-foreground">
                Color
              </Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
                placeholder="Blanco, Rojo, etc."
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
              />
            </div>

            <div>
              <Label htmlFor="capacity" className="text-foreground">
                Capacidad
              </Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity || ""}
                onChange={(e) =>
                  handleChange(
                    "capacity",
                    parseInt(e.target.value) || undefined
                  )
                }
                min="0"
                placeholder="20"
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
              />
            </div>

            <div>
              <Label htmlFor="capacityUnit" className="text-foreground">
                Unidad de Capacidad
              </Label>
              <Select
                value={formData.capacityUnit}
                onValueChange={(value) =>
                  handleChange("capacityUnit", value as CapacityUnit)
                }
              >
                <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAPACITY_UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="vin" className="text-foreground">
                VIN (Número de Identificación)
              </Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) =>
                  handleChange("vin", e.target.value.toUpperCase())
                }
                placeholder="1HGBH41JXMN109186"
                maxLength={50}
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes" className="text-foreground">
                Notas
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Información adicional sobre el camión..."
                rows={4}
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
              />
            </div>

            <div className="col-span-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="status"
                  checked={formData.status}
                  onChange={(e) => handleChange("status", e.target.checked)}
                  className="rounded border-border bg-ui-surface-elevated text-primary focus:ring-blue-500"
                />
                <Label
                  htmlFor="status"
                  className="text-foreground cursor-pointer"
                >
                  Camión Activo
                </Label>
              </div>
            </div>
          </div>
        </FormSection>
      </FormDialog>
    </main>
  );
}
