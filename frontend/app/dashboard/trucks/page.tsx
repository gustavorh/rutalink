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
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Truck as TruckIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
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
        // Update existing truck
        await updateTruck(token, truckToEdit.id, formData as UpdateTruckInput);
        setEditDialogOpen(false);
        setTruckToEdit(null);
      } else {
        // Create new truck
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

        {/* Filters Card */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                Filtros de Búsqueda
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Filtra y busca camiones según tus criterios
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-border text-foreground hover:bg-ui-surface-elevated"
            >
              {showFilters ? "Ocultar" : "Mostrar"} Filtros
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar - Always Visible */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por patente, marca, modelo..."
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

              {/* Additional Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Estado
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Tipo de Vehículo
                    </label>
                    <Select
                      value={vehicleTypeFilter}
                      onValueChange={setVehicleTypeFilter}
                    >
                      <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {VEHICLE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Estado Operativo
                    </label>
                    <Select
                      value={operationalStatusFilter}
                      onValueChange={setOperationalStatusFilter}
                    >
                      <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground">
                        <SelectValue placeholder="Estado Operativo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {OPERATIONAL_STATUS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trucks Table */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Listado de Camiones
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Total de {total} camiones registrados
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
                  Cargando camiones...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">{error}</p>
              </div>
            ) : trucks.length === 0 ? (
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
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">
                          Patente
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Marca / Modelo
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Año
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Tipo
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Capacidad
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Estado Operativo
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Operaciones
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
                      {trucks.map((truck) => {
                        const opStatus = getOperationalStatusInfo(
                          truck.operationalStatus
                        );
                        return (
                          <TableRow
                            key={truck.id}
                            className="border-b border-border hover:bg-ui-surface-elevated"
                          >
                            <TableCell className="font-mono text-sm text-foreground font-bold">
                              {truck.plateNumber}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-foreground">
                                  {truck.brand || "N/A"}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {truck.model || "Sin modelo"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground">
                              {truck.year || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-primary/50 text-primary"
                              >
                                {getVehicleTypeLabel(truck.vehicleType)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-foreground">
                              {truck.capacity
                                ? `${truck.capacity} ${
                                    truck.capacityUnit || ""
                                  }`
                                : "N/A"}
                            </TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>
                              <div className="text-sm space-y-1">
                                <div className="text-foreground">
                                  Total: {truck.totalOperations || 0}
                                </div>
                                <div className="text-muted-foreground">
                                  Próximas: {truck.upcomingOperations || 0}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    router.push(`/dashboard/trucks/${truck.id}`)
                                  }
                                  className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  title="Ver detalles"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClick(truck)}
                                  className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(truck)}
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(page - 1) * limit + 1} a{" "}
                    {Math.min(page * limit, total)} de {total} camiones
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
                      disabled={page === totalPages}
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
