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
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
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

  // Last update timestamp
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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
      setLastUpdate(new Date());
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

  // Define table columns
  const columns: DataTableColumn<Driver>[] = [
    {
      key: "rut",
      header: "RUT",
      accessor: (driver) => (
        <span className="font-mono text-sm">{driver.rut}</span>
      ),
    },
    {
      key: "name",
      header: "Nombre Completo",
      accessor: (driver) => (
        <div>
          <div className="font-medium text-foreground">
            {driver.firstName} {driver.lastName}
          </div>
          {driver.isExternal && driver.externalCompany && (
            <div className="text-xs text-muted-foreground mt-1">
              {driver.externalCompany}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contacto",
      accessor: (driver) => (
        <div className="text-sm space-y-1">
          {driver.email && (
            <div className="text-muted-foreground">{driver.email}</div>
          )}
          {driver.phone && (
            <div className="text-muted-foreground">{driver.phone}</div>
          )}
        </div>
      ),
    },
    {
      key: "license",
      header: "Licencia",
      accessor: (driver) => (
        <Badge variant="outline" className="border-primary/50 text-primary">
          {driver.licenseType}
        </Badge>
      ),
    },
    {
      key: "expiration",
      header: "Vigencia",
      accessor: (driver) => {
        const licenseStatus = getLicenseStatus(driver.licenseExpirationDate);
        return (
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
        );
      },
    },
    {
      key: "type",
      header: "Tipo",
      accessor: (driver) => (
        <Badge
          variant={driver.isExternal ? "outline" : "default"}
          className={
            driver.isExternal
              ? "border-orange-500/50 text-orange-400"
              : "bg-primary/10 text-primary border-primary/50"
          }
        >
          {driver.isExternal ? "Externo" : "Interno"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Estado",
      accessor: (driver) => (
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
      ),
    },
  ];

  // Define table actions
  const actions: DataTableAction<Driver>[] = [
    {
      label: "Ver detalles",
      icon: <Eye className="h-4 w-4" />,
      onClick: (driver) => router.push(`/drivers/${driver.id}`),
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
      ariaLabel: "Filtrar por estado del chofer",
    },
    {
      id: "external-filter",
      label: "Tipo de Chofer",
      type: "select",
      value: isExternalFilter,
      onChange: setIsExternalFilter,
      options: [
        { value: "all", label: "Todos" },
        { value: "internal", label: "Interno" },
        { value: "external", label: "Externo" },
      ],
      ariaLabel: "Filtrar por tipo de chofer",
    },
    {
      id: "license-type-filter",
      label: "Tipo de Licencia",
      type: "select",
      value: licenseTypeFilter,
      onChange: setLicenseTypeFilter,
      options: [
        { value: "all", label: "Todas las licencias" },
        ...LICENSE_TYPES.map((type) => ({
          value: type.value,
          label: type.value,
        })),
      ],
      ariaLabel: "Filtrar por tipo de licencia",
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
    setIsExternalFilter("all");
    setLicenseTypeFilter("all");
    setPage(1);
  };

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
                  <p className="text-xs font-medium text-muted-foreground">
                    Activos
                  </p>
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

        {/* Data Table with Integrated Filters */}
        <DataTable
          data={drivers}
          columns={columns}
          actions={actions}
          pagination={pagination}
          onPageChange={setPage}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nombre, RUT, email..."
          onSearchSubmit={handleSearch}
          filters={filters}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onClearFilters={handleClearFilters}
          loading={loading}
          error={error}
          title="Listado de Choferes"
          description={`Total de ${total} choferes registrados`}
          icon={<FileText className="w-5 h-5 text-primary" />}
          lastUpdate={lastUpdate}
          onRefresh={fetchDrivers}
          onExport={() => {
            /* TODO: Implement export functionality */
          }}
          getRowKey={(driver) => driver.id}
          emptyState={
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-muted-foreground">
                No se encontraron choferes
              </p>
              <Button
                onClick={handleCreateClick}
                className="mt-4 bg-primary hover:bg-primary-dark"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Primer Chofer
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
