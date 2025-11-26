"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser } from "@/lib/auth";
import { api } from "@/lib/client-api";
import type { Driver } from "@/types/drivers";
import type {
  CreateDriverDto,
  UpdateDriverDto,
  DriverQueryDto,
} from "@/lib/api-types";
import { LICENSE_TYPES } from "@/types/drivers";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableAction,
} from "@/components/ui/data-table";
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
  FileText,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
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
import { toast } from "sonner";
import {
  exportDriversToXLSX,
  exportDriversToPDF,
  type DriverExportData,
} from "@/lib/export-utils";
import type { ExportFormat } from "@/components/ui/export-dropdown";

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
  const [formData, setFormData] = useState<CreateDriverDto>({
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
  const {
    filters: filterState,
    setFilter,
    showFilters,
    toggleFilters,
    clearFilters: clearAllFilters,
  } = useFilters({
    initialFilters: {
      status: "all",
      isExternal: "all",
      licenseType: "all",
    },
  });

  // Pagination
  const { page, setPage, total, setTotal, setTotalPages, pagination } =
    usePagination({ initialLimit: 10 });

  // Last update timestamp
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Export loading state
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    search,
    filterState.status,
    filterState.isExternal,
    filterState.licenseType,
  ]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const params: DriverQueryDto = {
        operatorId: user.operatorId,
        page,
        limit: pagination.limit,
      };

      if (search) params.search = search;
      if (filterState.status !== "all")
        params.status = filterState.status === "active" ? true : false;
      if (filterState.isExternal !== "all")
        params.isExternal =
          filterState.isExternal === "external" ? true : false;
      if (filterState.licenseType !== "all")
        params.licenseType = filterState.licenseType;

      const response = await api.drivers.list(params);
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
      await api.drivers.delete(driverToDelete.id);
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
    const user = getUser();
    if (!user) return;

    try {
      setFormLoading(true);
      setError(null);

      if (editDialogOpen && driverToEdit) {
        // Update existing driver
        // Remove fields that shouldn't be updated
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { operatorId, rut, ...cleanData } = formData as CreateDriverDto;
        await api.drivers.update(driverToEdit.id, cleanData as UpdateDriverDto);
        setEditDialogOpen(false);
        setDriverToEdit(null);
      } else {
        // Create new driver
        await api.drivers.create(formData as CreateDriverDto);
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
    field: keyof CreateDriverDto,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle export
  const handleExport = async (format: ExportFormat) => {
    if (drivers.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    setExportLoading(true);

    try {
      // Transform drivers to export format
      const exportData: DriverExportData[] = drivers.map((driver) => ({
        id: driver.id,
        rut: driver.rut,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone,
        licenseType: driver.licenseType,
        licenseNumber: driver.licenseNumber,
        licenseExpirationDate: driver.licenseExpirationDate,
        isExternal: driver.isExternal,
        externalCompany: driver.externalCompany,
        status: driver.status,
        city: driver.city,
        region: driver.region,
      }));

      if (format === "xlsx") {
        exportDriversToXLSX(exportData, "choferes");
        toast.success("Archivo Excel exportado correctamente");
      } else if (format === "pdf") {
        exportDriversToPDF(exportData, "choferes");
        toast.success("Archivo PDF exportado correctamente");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Error al exportar los datos");
    } finally {
      setExportLoading(false);
    }
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
    return <LoadingState />;
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

  // Row click handler
  const handleRowClick = (driver: Driver) => {
    router.push(`/drivers/${driver.id}`);
  };

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
      ariaLabel: "Filtrar por estado del chofer",
    },
    {
      id: "external-filter",
      label: "Tipo de Chofer",
      type: "select",
      value: filterState.isExternal,
      onChange: (value) => setFilter("isExternal", value),
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
      value: filterState.licenseType,
      onChange: (value) => setFilter("licenseType", value),
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
          title="Mantenedor de Choferes"
          description="Gestión centralizada de choferes y su documentación"
          icon={<Users className="w-6 h-6" />}
          actionLabel={
            <>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Chofer
            </>
          }
          onAction={handleCreateClick}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatisticsCard
            value={total}
            label="Total Choferes"
            icon={<Users className="w-6 h-6" />}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
          />
          <StatisticsCard
            value={activeDrivers}
            label="Activos"
            icon={<CheckCircle className="w-6 h-6" />}
            iconBgColor="bg-success/10"
            iconColor="text-success"
          />
          <StatisticsCard
            value={`${internalDrivers} / ${externalDrivers}`}
            label="Internos / Externos"
            icon={<Truck className="w-6 h-6" />}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
          />
          <StatisticsCard
            value={expiredLicenses}
            label="Licencias Vencidas"
            icon={<AlertTriangle className="w-6 h-6" />}
            iconBgColor="bg-destructive/10"
            iconColor="text-destructive"
            valueColor="text-destructive"
          />
        </div>

        {/* Data Table with Integrated Filters */}
        <DataTable
          data={drivers}
          columns={columns}
          actions={actions}
          onRowClick={handleRowClick}
          pagination={pagination}
          onPageChange={setPage}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nombre, RUT, email..."
          onSearchSubmit={handleSearch}
          filters={filters}
          showFilters={showFilters}
          onToggleFilters={toggleFilters}
          onClearFilters={handleClearFilters}
          loading={loading}
          error={error}
          title="Listado de Choferes"
          description={`Total de ${total} choferes registrados`}
          icon={<FileText className="w-5 h-5 text-primary" />}
          lastUpdate={lastUpdate}
          onRefresh={fetchDrivers}
          onExport={handleExport}
          exportLoading={exportLoading}
          getRowKey={(driver) => driver.id}
          emptyState={
            <EmptyState
              icon={<Users className="w-12 h-12 text-slate-600" />}
              title="No se encontraron choferes"
              actionLabel={
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primer Chofer
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
        itemName={
          driverToDelete
            ? `${driverToDelete.firstName} ${driverToDelete.lastName}`
            : undefined
        }
        itemType="chofer"
      />

      {/* Create/Edit Driver Dialog */}
      <FormDialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setDriverToEdit(null);
          }
        }}
        title={editDialogOpen ? "Editar Chofer" : "Nuevo Chofer"}
        description={
          editDialogOpen
            ? "Actualiza la información del chofer"
            : "Completa la información del nuevo chofer"
        }
        onSubmit={handleFormSubmit}
        loading={formLoading}
        submitLabel={editDialogOpen ? "Actualizar Chofer" : "Crear Chofer"}
        maxWidth="4xl"
        onCancel={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setDriverToEdit(null);
        }}
      >
        <FormSection title="Información Personal">
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
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
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
        </FormSection>

        <FormSection title="Información de Licencia">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="licenseType" className="text-foreground">
                Tipo de Licencia *
              </Label>
              <Select
                value={formData.licenseType}
                onValueChange={(value) => handleChange("licenseType", value)}
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
                onChange={(e) => handleChange("licenseNumber", e.target.value)}
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
        </FormSection>

        <FormSection title="Contacto de Emergencia">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContactName" className="text-foreground">
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
        </FormSection>

        <FormSection title="Información Adicional">
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
                onChange={(e) => handleChange("isExternal", e.target.checked)}
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
        </FormSection>
      </FormDialog>
    </main>
  );
}
