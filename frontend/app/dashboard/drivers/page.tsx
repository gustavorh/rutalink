"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import {
  getDrivers,
  deleteDriver,
  createDriver,
  updateDriver,
} from "@/lib/api";
import type {
  Driver,
  DriverQueryParams,
  CreateDriverInput,
} from "@/types/drivers";
import { LICENSE_TYPES } from "@/types/drivers";
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
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Users,
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

export default function DriversPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<CreateDriverInput>({
    operatorId: 0,
    rut: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    licenseType: "B",
    licenseNumber: "",
    licenseExpirationDate: "",
    dateOfBirth: "",
    address: "",
    city: "",
    region: "",
    status: true,
    isExternal: false,
    externalCompany: "",
    notes: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isExternalFilter, setIsExternalFilter] = useState<string>("all");
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<string>("all");
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
    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, isExternalFilter, licenseTypeFilter]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const user = getUser();
      if (!token || !user) {
        router.push("/login");
        return;
      }

      const params: DriverQueryParams = {
        operatorId: user.operatorId,
        page,
        limit,
      };

      if (search) params.search = search;
      if (statusFilter !== "all")
        params.status = statusFilter === "active" ? true : false;
      if (isExternalFilter !== "all")
        params.isExternal = isExternalFilter === "external" ? true : false;
      if (licenseTypeFilter !== "all") params.licenseType = licenseTypeFilter;

      const response = await getDrivers(token, params);
      setDrivers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar choferes");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchDrivers();
  };

  const handleDeleteClick = (driver: Driver) => {
    setDriverToDelete(driver);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!driverToDelete) return;

    try {
      const token = getToken();
      if (!token) return;

      await deleteDriver(token, driverToDelete.id);
      setDeleteDialogOpen(false);
      setDriverToDelete(null);
      fetchDrivers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar chofer");
    }
  };

  const handleCreateClick = () => {
    const user = getUser();
    if (!user) return;

    setFormData({
      operatorId: user.operatorId,
      rut: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      licenseType: "B",
      licenseNumber: "",
      licenseExpirationDate: "",
      dateOfBirth: "",
      address: "",
      city: "",
      region: "",
      status: true,
      isExternal: false,
      externalCompany: "",
      notes: "",
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = async (driver: Driver) => {
    setDriverToEdit(driver);

    // Format dates for input fields
    const formatDateForInput = (dateString?: string) => {
      if (!dateString) return "";
      return new Date(dateString).toISOString().split("T")[0];
    };

    setFormData({
      operatorId: driver.operatorId,
      rut: driver.rut,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email || "",
      phone: driver.phone || "",
      emergencyContactName: driver.emergencyContactName || "",
      emergencyContactPhone: driver.emergencyContactPhone || "",
      licenseType: driver.licenseType,
      licenseNumber: driver.licenseNumber,
      licenseExpirationDate: formatDateForInput(driver.licenseExpirationDate),
      dateOfBirth: formatDateForInput(driver.dateOfBirth),
      address: driver.address || "",
      city: driver.city || "",
      region: driver.region || "",
      status: driver.status,
      isExternal: driver.isExternal,
      externalCompany: driver.externalCompany || "",
      notes: driver.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    const user = getUser();
    if (!token || !user) return;

    try {
      setFormLoading(true);
      setError(null);

      if (editDialogOpen && driverToEdit) {
        // Update existing driver
        // Remove fields that shouldn't be updated
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { operatorId, rut, ...cleanData } = formData as CreateDriverInput;
        await updateDriver(token, driverToEdit.id, cleanData);
        setEditDialogOpen(false);
        setDriverToEdit(null);
      } else {
        // Create new driver
        await createDriver(token, formData as CreateDriverInput);
        setCreateDialogOpen(false);
      }

      fetchDrivers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar chofer");
    } finally {
      setFormLoading(false);
    }
  };

  const handleChange = (
    field: keyof CreateDriverInput,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CL");
  };

  const isLicenseExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const isLicenseExpiringSoon = (dateString: string) => {
    const expirationDate = new Date(dateString);
    const today = new Date();
    const daysUntilExpiration = Math.floor(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  };

  const getLicenseStatus = (dateString: string) => {
    if (isLicenseExpired(dateString)) {
      return { status: "expired", color: "red", label: "Vencida" };
    }
    if (isLicenseExpiringSoon(dateString)) {
      return { status: "expiring", color: "yellow", label: "Por vencer" };
    }
    return { status: "valid", color: "green", label: "Vigente" };
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
  const activeDrivers = drivers.filter((d) => d.status).length;
  const internalDrivers = drivers.filter((d) => !d.isExternal).length;
  const externalDrivers = drivers.filter((d) => d.isExternal).length;
  const expiredLicenses = drivers.filter((d) =>
    isLicenseExpired(d.licenseExpirationDate)
  ).length;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header with Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Mantenedor de Choferes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión centralizada de choferes y su documentación
            </p>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-primary hover:bg-primary-dark text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Chofer
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Choferes
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Activos</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {activeDrivers}
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
                    Internos / Externos
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {internalDrivers} / {externalDrivers}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Licencias Vencidas
                  </p>
                  <p className="text-2xl font-bold text-destructive mt-1">
                    {expiredLicenses}
                  </p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
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
                Filtra y busca choferes según tus criterios
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
                    placeholder="Buscar por nombre, RUT, email..."
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
                      Tipo de Chofer
                    </label>
                    <Select
                      value={isExternalFilter}
                      onValueChange={setIsExternalFilter}
                    >
                      <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="internal">Interno</SelectItem>
                        <SelectItem value="external">Externo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Tipo de Licencia
                    </label>
                    <Select
                      value={licenseTypeFilter}
                      onValueChange={setLicenseTypeFilter}
                    >
                      <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground">
                        <SelectValue placeholder="Licencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las licencias</SelectItem>
                        {LICENSE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.value}
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

        {/* Drivers Table */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Listado de Choferes
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Total de {total} choferes registrados
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
                <p className="text-muted-foreground mt-4">Cargando choferes...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">{error}</p>
              </div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron choferes</p>
                <Button
                  onClick={handleCreateClick}
                  className="mt-4 bg-primary hover:bg-primary-dark"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primer Chofer
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">RUT</TableHead>
                        <TableHead className="text-muted-foreground">
                          Nombre Completo
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Contacto
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Licencia
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Vigencia
                        </TableHead>
                        <TableHead className="text-muted-foreground">Tipo</TableHead>
                        <TableHead className="text-muted-foreground">Estado</TableHead>
                        <TableHead className="text-right text-muted-foreground">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map((driver) => {
                        const licenseStatus = getLicenseStatus(
                          driver.licenseExpirationDate
                        );
                        return (
                          <TableRow
                            key={driver.id}
                            className="border-b border-border hover:bg-ui-surface-elevated"
                          >
                            <TableCell className="font-mono text-sm text-foreground">
                              {driver.rut}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-foreground">
                                  {driver.firstName} {driver.lastName}
                                </div>
                                {driver.isExternal &&
                                  driver.externalCompany && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {driver.externalCompany}
                                    </div>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm space-y-1">
                                {driver.email && (
                                  <div className="text-muted-foreground">
                                    {driver.email}
                                  </div>
                                )}
                                {driver.phone && (
                                  <div className="text-muted-foreground">
                                    {driver.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-primary/50 text-primary"
                              >
                                {driver.licenseType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {licenseStatus.status === "expired" && (
                                  <AlertTriangle className="w-4 h-4 text-destructive" />
                                )}
                                {licenseStatus.status === "expiring" && (
                                  <Clock className="w-4 h-4 text-warning" />
                                )}
                                {licenseStatus.status === "valid" && (
                                  <CheckCircle className="w-4 h-4 text-success" />
                                )}
                                <div>
                                  <div
                                    className={`text-sm ${
                                      licenseStatus.status === "expired"
                                        ? "text-destructive"
                                        : licenseStatus.status === "expiring"
                                        ? "text-warning"
                                        : "text-success"
                                    }`}
                                  >
                                    {licenseStatus.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(driver.licenseExpirationDate)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  driver.isExternal ? "outline" : "default"
                                }
                                className={
                                  driver.isExternal
                                    ? "border-orange-500/50 text-orange-400"
                                    : "bg-primary/10 text-primary border-primary/50"
                                }
                              >
                                {driver.isExternal ? "Externo" : "Interno"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={driver.status ? "default" : "outline"}
                                className={
                                  driver.status
                                    ? "bg-success/10 text-success border-success/50"
                                    : "border-slate-500/50 text-muted-foreground"
                                }
                              >
                                {driver.status ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/drivers/${driver.id}`
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
                                  onClick={() => handleEditClick(driver)}
                                  className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(driver)}
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
                    {Math.min(page * limit, total)} de {total} choferes
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
                            <span className="text-muted-foreground px-2">...</span>
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
              ¿Estás seguro de que deseas eliminar al chofer{" "}
              <strong className="text-foreground">
                {driverToDelete?.firstName} {driverToDelete?.lastName}
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

      {/* Create/Edit Driver Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setDriverToEdit(null);
          }
        }}
      >
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editDialogOpen ? "Editar Chofer" : "Nuevo Chofer"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editDialogOpen
                ? "Actualiza la información del chofer"
                : "Completa la información del nuevo chofer"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Información Personal
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rut" className="text-foreground">
                    RUT *
                  </Label>
                  <Input
                    id="rut"
                    value={formData.rut}
                    onChange={(e) => handleChange("rut", e.target.value)}
                    placeholder="12.345.678-9"
                    required
                    disabled={editDialogOpen}
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="firstName" className="text-foreground">
                    Nombre *
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    required
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-foreground">
                    Apellido *
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    required
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth" className="text-foreground">
                    Fecha de Nacimiento
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleChange("dateOfBirth", e.target.value)
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-foreground">
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address" className="text-foreground">
                    Dirección
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="city" className="text-foreground">
                    Ciudad
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="region" className="text-foreground">
                    Región
                  </Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => handleChange("region", e.target.value)}
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>
              </div>
            </div>

            {/* License Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Información de Licencia
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="licenseType" className="text-foreground">
                    Tipo de Licencia *
                  </Label>
                  <Select
                    value={formData.licenseType}
                    onValueChange={(value) =>
                      handleChange("licenseType", value)
                    }
                  >
                    <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="licenseNumber" className="text-foreground">
                    Número de Licencia *
                  </Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      handleChange("licenseNumber", e.target.value)
                    }
                    required
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <Label
                    htmlFor="licenseExpirationDate"
                    className="text-foreground"
                  >
                    Fecha de Vencimiento *
                  </Label>
                  <Input
                    id="licenseExpirationDate"
                    type="date"
                    value={formData.licenseExpirationDate}
                    onChange={(e) =>
                      handleChange("licenseExpirationDate", e.target.value)
                    }
                    required
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Contacto de Emergencia
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="emergencyContactName"
                    className="text-foreground"
                  >
                    Nombre de Contacto
                  </Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) =>
                      handleChange("emergencyContactName", e.target.value)
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="emergencyContactPhone"
                    className="text-foreground"
                  >
                    Teléfono de Contacto
                  </Label>
                  <Input
                    id="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) =>
                      handleChange("emergencyContactPhone", e.target.value)
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Información Adicional
              </h3>

              <div className="grid grid-cols-2 gap-4">
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
                    Chofer Activo
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isExternal"
                    checked={formData.isExternal}
                    onChange={(e) =>
                      handleChange("isExternal", e.target.checked)
                    }
                    className="rounded border-border bg-ui-surface-elevated text-primary focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="isExternal"
                    className="text-foreground cursor-pointer"
                  >
                    Chofer Externo
                  </Label>
                </div>
              </div>

              {formData.isExternal && (
                <div>
                  <Label htmlFor="externalCompany" className="text-foreground">
                    Empresa Externa
                  </Label>
                  <Input
                    id="externalCompany"
                    value={formData.externalCompany}
                    onChange={(e) =>
                      handleChange("externalCompany", e.target.value)
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Nombre de la empresa"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="notes" className="text-foreground">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  placeholder="Información adicional sobre el chofer"
                  className="bg-ui-surface-elevated border-border text-foreground mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditDialogOpen(false);
                  setDriverToEdit(null);
                }}
                className="border-border text-foreground hover:bg-ui-surface-elevated"
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editDialogOpen ? "Actualizar Chofer" : "Crear Chofer"}
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
