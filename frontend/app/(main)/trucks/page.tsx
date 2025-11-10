"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import { getTrucks, deleteTruck, createTruck, updateTruck } from "@/lib/api";
import type {
  Truck,
  TruckQueryParams,
  CreateTruckInput,
  UpdateTruckInput,
} from "@/types/trucks";
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
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [formData, setFormData] = useState<CreateTruckInput | UpdateTruckInput>(
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all");
  const [operationalStatusFilter, setOperationalStatusFilter] =
    useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

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
  }, [page, search, statusFilter, vehicleTypeFilter, operationalStatusFilter]);

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const user = getUser();
      if (!token || !user) {
        router.push("/login");
        return;
      }

      const params: TruckQueryParams = {
        page,
        limit,
        includeStats: true,
      };

      if (search) params.search = search;
      if (statusFilter !== "all")
        params.status = statusFilter === "active" ? true : false;
      if (vehicleTypeFilter !== "all") {
        params.vehicleType =
          vehicleTypeFilter as TruckQueryParams["vehicleType"];
      }
      if (operationalStatusFilter !== "all") {
        params.operationalStatus =
          operationalStatusFilter as TruckQueryParams["operationalStatus"];
      }

      const response = await getTrucks(token, params);
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
      const token = getToken();
      if (!token) return;

      await deleteTruck(token, truckToDelete.id);
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
    const token = getToken();
    if (!token) return;

    try {
      setFormLoading(true);
      setError(null);

      if (editDialogOpen && truckToEdit) {
        await updateTruck(token, truckToEdit.id, formData as UpdateTruckInput);
        setEditDialogOpen(false);
        setTruckToEdit(null);
      } else {
        await createTruck(token, formData as CreateTruckInput);
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
    field: keyof CreateTruckInput,
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-surface-elevated">
        <p className="text-foreground">Cargando...</p>
      </div>
    );
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
      value: statusFilter,
      onChange: setStatusFilter,
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
      value: vehicleTypeFilter,
      onChange: setVehicleTypeFilter,
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
      value: operationalStatusFilter,
      onChange: setOperationalStatusFilter,
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

  // Define pagination
  const pagination: PaginationInfo = {
    page,
    limit,
    total,
    totalPages,
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setVehicleTypeFilter("all");
    setOperationalStatusFilter("all");
    setPage(1);
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header with Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <TruckIcon className="w-6 h-6 text-primary" />
              Mantenedor de Camiones
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión de flota de camiones y documentación
            </p>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-primary hover:bg-primary-dark text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Camión
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Camiones
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TruckIcon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Activos
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {activeTrucks}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    En Mantenimiento
                  </p>
                  <p className="text-2xl font-bold text-warning mt-1">
                    {inMaintenanceTrucks}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Operaciones Próximas
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {totalUpcomingOperations}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
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
          onToggleFilters={() => setShowFilters(!showFilters)}
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
            <div className="text-center py-12">
              <TruckIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-muted-foreground">
                No se encontraron camiones
              </p>
              <Button
                onClick={handleCreateClick}
                className="mt-4 bg-primary hover:bg-primary-dark"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Primer Camión
              </Button>
            </div>
          }
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Estás seguro de que deseas eliminar el camión{" "}
              <strong className="text-foreground">
                {truckToDelete?.plateNumber}
              </strong>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-border text-foreground hover:bg-ui-surface-elevated"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Truck Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setTruckToEdit(null);
          }
        }}
      >
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editDialogOpen ? "Editar Camión" : "Nuevo Camión"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editDialogOpen
                ? "Actualiza la información del camión"
                : "Completa los datos del nuevo camión"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Información del Camión
              </h3>

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
                      handleChange(
                        "year",
                        parseInt(e.target.value) || undefined
                      )
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditDialogOpen(false);
                  setTruckToEdit(null);
                }}
                className="border-border text-foreground hover:bg-ui-surface-elevated"
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={formLoading || !formData.plateNumber}
                className="bg-primary hover:bg-primary-dark text-white"
              >
                {formLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editDialogOpen ? "Guardar Cambios" : "Guardar Camión"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
