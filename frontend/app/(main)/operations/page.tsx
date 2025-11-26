"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser } from "@/lib/auth";
import { api } from "@/lib/client-api";
import type { OperationWithDetails } from "@/types/operations";
import type {
  CreateOperationDto,
  UpdateOperationDto,
  OperationQueryDto,
} from "@/lib/api-types";
import type { Client } from "@/types/clients";
import type { Provider } from "@/types/providers";
import type { Driver } from "@/types/drivers";
import type { Truck as TruckType } from "@/types/trucks";
import type { Route } from "@/types/routes";

// Form data type for operation create/edit forms
interface OperationFormData {
  operatorId?: number;
  operationNumber?: string;
  operationType: string;
  origin: string;
  destination: string;
  scheduledStartDate: string;
  scheduledEndDate?: string;
  cargoDescription?: string;
  notes?: string;
  clientId?: number;
  providerId?: number;
  routeId?: number;
  driverId?: number;
  vehicleId?: number;
  distance?: number;
  cargoWeight?: number;
  status?: string;
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableAction,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
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
  AlertTriangle,
  TrendingUp,
  Calendar,
  Truck,
  Clock,
  Package,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { StatisticsCard } from "@/components/ui/statistics-card";
import { usePagination } from "@/lib/hooks/use-pagination";
import { useFilters } from "@/lib/hooks/use-filters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  OPERATION_TYPES as OperationTypes,
  OPERATION_STATUS as OperationStatuses,
} from "@/types/operations";

export default function OperationsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [operations, setOperations] = useState<OperationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [operationToDelete, setOperationToDelete] =
    useState<OperationWithDetails | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [operationToEdit, setOperationToEdit] =
    useState<OperationWithDetails | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form data
  const [formData, setFormData] = useState<OperationFormData>({
    operationType: "delivery",
    origin: "",
    destination: "",
    scheduledStartDate: "",
    scheduledEndDate: "",
    cargoDescription: "",
    notes: "",
  });

  // Catalogs for dropdowns
  const [clients, setClients] = useState<Client[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<TruckType[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

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
      type: "all",
      client: "all",
      provider: "all",
    },
  });
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    start: string;
    end: string;
  }>({ start: "", end: "" });

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
    fetchCatalogs();
    fetchOperations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    filterState.type,
    filterState.client,
    filterState.provider,
    viewMode,
    currentMonth,
    dateRangeFilter.start,
    dateRangeFilter.end,
  ]);

  const fetchCatalogs = async () => {
    try {
      const user = getUser();
      if (!user) return;

      const [clientsRes, providersRes, driversRes, vehiclesRes, routesRes] =
        await Promise.all([
          api.clients.list({
            operatorId: user.operatorId,
            status: true,
            limit: 100,
          }),
          api.providers.list({
            operatorId: user.operatorId,
            status: true,
            limit: 100,
          }),
          api.drivers.list({
            operatorId: user.operatorId,
            status: true,
            limit: 100,
          }),
          api.vehicles.list({
            status: true,
            limit: 100,
          }),
          api.routes.list({ status: true, limit: 100 }),
        ]);

      setClients(
        clientsRes.data ||
          (clientsRes as { items?: typeof clientsRes.data }).items ||
          []
      );
      setProviders(
        providersRes.data ||
          (providersRes as { items?: typeof providersRes.data }).items ||
          []
      );
      setDrivers(
        driversRes.data ||
          (driversRes as { items?: typeof driversRes.data }).items ||
          []
      );
      setVehicles(
        vehiclesRes.data ||
          (vehiclesRes as { items?: typeof vehiclesRes.data }).items ||
          []
      );
      setRoutes(
        routesRes.data ||
          (routesRes as { items?: typeof routesRes.data }).items ||
          []
      );
    } catch (err) {
      console.error("Error loading catalogs:", err);
    }
  };

  const fetchOperations = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const params: OperationQueryDto = {
        operatorId: user.operatorId,
        page: page,
        limit: viewMode === "calendar" ? 100 : pagination.limit, // Fetch up to 100 for calendar view
        status: "scheduled", // Only fetch programmed operations
      };
      if (filterState.type !== "all") params.operationType = filterState.type;
      if (filterState.client !== "all")
        params.clientId = parseInt(filterState.client);
      if (filterState.provider !== "all")
        params.providerId = parseInt(filterState.provider);

      // For calendar view, fetch operations for the current month
      if (viewMode === "calendar") {
        const firstDay = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          1
        );
        const lastDay = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        params.startDate = firstDay.toISOString();
        params.endDate = lastDay.toISOString();
      } else {
        // For list view, use the date range filter if set
        if (dateRangeFilter.start) params.startDate = dateRangeFilter.start;
        if (dateRangeFilter.end) params.endDate = dateRangeFilter.end;
      }

      const response = await api.operations.list(params);
      const items =
        response.data ||
        (response as { items?: typeof response.data }).items ||
        [];
      setOperations(items);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
      setLastUpdate(new Date()); // Update timestamp
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar operaciones"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOperations();
  };

  const handleRefresh = async () => {
    await fetchOperations();
  };

  const handleDeleteClick = (operation: OperationWithDetails) => {
    setOperationToDelete(operation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!operationToDelete) return;

    try {
      await api.operations.delete(operationToDelete.operation.id);
      setDeleteDialogOpen(false);
      setOperationToDelete(null);
      fetchOperations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar operación"
      );
    }
  };

  const handleCreateClick = () => {
    const user = getUser();
    if (!user) return;

    // Generate operation number
    const operationNumber = `OP-${Date.now()}`;

    setError(null); // Clear any previous errors
    setFormData({
      operatorId: user.operatorId,
      operationNumber,
      operationType: "delivery",
      origin: "",
      destination: "",
      scheduledStartDate: "",
      scheduledEndDate: "",
      cargoDescription: "",
      notes: "",
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (operation: OperationWithDetails) => {
    setError(null); // Clear any previous errors
    setOperationToEdit(operation);

    // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateTimeLocal = (dateString?: string | null) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      operationType: operation.operation.operationType,
      origin: operation.operation.origin,
      destination: operation.operation.destination,
      clientId: operation.operation.clientId || undefined,
      providerId: operation.operation.providerId || undefined,
      routeId: operation.operation.routeId || undefined,
      driverId: operation.operation.driverId,
      vehicleId: operation.operation.vehicleId,
      scheduledStartDate: formatDateTimeLocal(
        operation.operation.scheduledStartDate
      ),
      scheduledEndDate: formatDateTimeLocal(
        operation.operation.scheduledEndDate
      ),
      distance: operation.operation.distance || undefined,
      cargoDescription: operation.operation.cargoDescription || "",
      cargoWeight: operation.operation.cargoWeight || undefined,
      status: operation.operation.status,
      notes: operation.operation.notes || "",
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

      if (editDialogOpen && operationToEdit) {
        // Update existing operation
        // Convert string IDs to numbers
        const updateData: UpdateOperationDto = {
          operationType: formData.operationType,
          origin: formData.origin,
          destination: formData.destination,
          clientId: formData.clientId ? Number(formData.clientId) : undefined,
          providerId: formData.providerId
            ? Number(formData.providerId)
            : undefined,
          routeId: formData.routeId ? Number(formData.routeId) : undefined,
          driverId: formData.driverId ? Number(formData.driverId) : undefined,
          vehicleId: formData.vehicleId
            ? Number(formData.vehicleId)
            : undefined,
          scheduledStartDate: formData.scheduledStartDate,
          scheduledEndDate: formData.scheduledEndDate || undefined,
          distance: formData.distance ? Number(formData.distance) : undefined,
          status: formData.status as
            | "scheduled"
            | "in-progress"
            | "completed"
            | "cancelled"
            | undefined,
          cargoDescription: formData.cargoDescription || undefined,
          cargoWeight: formData.cargoWeight
            ? Number(formData.cargoWeight)
            : undefined,
          notes: formData.notes || undefined,
        };
        await api.operations.update(operationToEdit.operation.id, updateData);
        setEditDialogOpen(false);
        setOperationToEdit(null);
      } else {
        // Create new operation
        // Validate required fields
        if (!formData.driverId || !formData.vehicleId) {
          setError("Chofer y vehículo son obligatorios");
          return;
        }

        // Convert string IDs to numbers and ensure correct types
        const createData: CreateOperationDto = {
          operatorId: user.operatorId,
          operationNumber: formData.operationNumber || "",
          operationType: formData.operationType,
          origin: formData.origin,
          destination: formData.destination,
          scheduledStartDate: formData.scheduledStartDate,
          scheduledEndDate: formData.scheduledEndDate || undefined,
          driverId: Number(formData.driverId),
          vehicleId: Number(formData.vehicleId),
          clientId: formData.clientId ? Number(formData.clientId) : undefined,
          providerId: formData.providerId
            ? Number(formData.providerId)
            : undefined,
          routeId: formData.routeId ? Number(formData.routeId) : undefined,
          distance: formData.distance ? Number(formData.distance) : undefined,
          cargoDescription: formData.cargoDescription || undefined,
          cargoWeight: formData.cargoWeight
            ? Number(formData.cargoWeight)
            : undefined,
          notes: formData.notes || undefined,
        };
        await api.operations.create(createData);
        setCreateDialogOpen(false);
      }

      fetchOperations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar operación"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = OperationStatuses.find((s) => s.value === status);
    const colorMap: Record<string, string> = {
      blue: "bg-primary/10 text-primary border-primary/50",
      cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/50",
      yellow: "bg-warning/10 text-warning border-yellow-500/50",
      green: "bg-success/10 text-success border-success/50",
      red: "bg-destructive/10 text-destructive border-destructive/50",
      orange: "bg-orange-500/10 text-orange-400 border-orange-500/50",
    };

    return (
      <Badge
        variant="outline"
        className={statusConfig ? colorMap[statusConfig.color] : ""}
      >
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getOperationTypeLabel = (type: string) => {
    const typeConfig = OperationTypes.find((t) => t.value === type);
    return typeConfig?.label || type;
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

  // Calculate statistics - All operations shown are scheduled
  const totalScheduled = operations.length; // All displayed operations are scheduled

  // Calendar utility functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, firstDay, lastDay };
  };

  const getOperationsForDate = (date: Date) => {
    return operations.filter((op) => {
      const opDate = new Date(op.operation.scheduledStartDate);
      return (
        opDate.getDate() === date.getDate() &&
        opDate.getMonth() === date.getMonth() &&
        opDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const changeMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return new Intl.DateTimeFormat("es-CL", {
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDayClick = (date: Date) => {
    // Set date filter for the selected day (start of day to end of day)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    setDateRangeFilter({
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString(),
    });

    // Switch to list view
    setViewMode("list");

    // Reset to first page
    setPage(1);
  };

  // Render calendar view
  const renderCalendarView = () => {
    const { daysInMonth, startingDayOfWeek, firstDay } =
      getDaysInMonth(currentMonth);
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(
        new Date(
          firstDay.getFullYear(),
          firstDay.getMonth(),
          -startingDayOfWeek + i + 1
        )
      );
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      currentWeek.push(date);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add remaining days to complete the last week
    if (currentWeek.length > 0) {
      const remainingDays = 7 - currentWeek.length;
      for (let i = 1; i <= remainingDays; i++) {
        currentWeek.push(
          new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i)
        );
      }
      weeks.push(currentWeek);
    }

    return (
      <div className="space-y-3">
        {/* Calendar Header with Filters */}
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {formatMonthYear(currentMonth)}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeMonth("prev")}
                className="border-border text-foreground hover:bg-ui-surface-elevated"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Mes anterior</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="border-border text-foreground hover:bg-ui-surface-elevated"
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeMonth("next")}
                className="border-border text-foreground hover:bg-ui-surface-elevated"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Mes siguiente</span>
              </Button>
            </div>
          </div>

          {/* Integrated Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Tipo de Operación
              </label>
              <Select
                value={filterState.type}
                onValueChange={(value) => setFilter("type", value)}
              >
                <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground h-9">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {OperationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Cliente
              </label>
              <Select
                value={filterState.client}
                onValueChange={(value) => setFilter("client", value)}
              >
                <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground h-9">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Proveedor
              </label>
              <Select
                value={filterState.provider}
                onValueChange={(value) => setFilter("provider", value)}
              >
                <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground h-9">
                  <SelectValue placeholder="Proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proveedores</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem
                      key={provider.id}
                      value={provider.id.toString()}
                    >
                      {provider.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-ui-surface-elevated border-b border-border">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-xs font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar weeks */}
          <div className="divide-y divide-border">
            {weeks.map((week, weekIdx) => (
              <div
                key={weekIdx}
                className="grid grid-cols-7 divide-x divide-border"
              >
                {week.map((date, dayIdx) => {
                  const isCurrentMonth =
                    date.getMonth() === currentMonth.getMonth();
                  const dayOperations = getOperationsForDate(date);
                  const todayCheck = isToday(date);

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => handleDayClick(date)}
                      className={`min-h-[80px] p-2 cursor-pointer transition-colors relative ${
                        !isCurrentMonth
                          ? dayOperations.length > 0
                            ? "bg-primary/5 border border-primary/20"
                            : "bg-ui-surface-elevated/30"
                          : dayOperations.length > 0
                          ? "bg-primary/5 border border-primary/20 hover:bg-primary/10"
                          : "bg-card hover:bg-ui-surface-elevated"
                      }`}
                    >
                      <div className="relative h-full">
                        <div
                          className={`text-sm font-medium ${
                            todayCheck
                              ? "bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center"
                              : isCurrentMonth
                              ? "text-foreground"
                              : "text-muted-foreground/50"
                          }`}
                        >
                          {date.getDate()}
                        </div>
                        {dayOperations.length > 0 && (
                          <div className="absolute top-0 right-0">
                            <div className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-sm">
                              {dayOperations.length}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header with Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-6 h-6 text-secondary" />
              Programación de Operaciones
            </h1>
            <p className="text-muted-foreground mt-1">
              Coordinación y gestión de traslados y operaciones logísticas
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setViewMode(viewMode === "list" ? "calendar" : "list")
              }
              className="border-border text-foreground hover:bg-ui-surface-elevated"
            >
              {viewMode === "list" ? (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Vista Calendario
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Vista Lista
                </>
              )}
            </Button>
            <Button
              onClick={handleCreateClick}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Operación
            </Button>
          </div>
        </div>

        {/* Statistics Cards - Only show in list view */}
        {viewMode === "list" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatisticsCard
              value={total}
              label="Operaciones Programadas"
              icon={<Calendar className="w-6 h-6" />}
              iconBgColor="bg-secondary/10"
              iconColor="text-secondary"
            />
            <StatisticsCard
              value={totalScheduled}
              label="En Esta Página"
              icon={<Clock className="w-6 h-6" />}
              iconBgColor="bg-primary/10"
              iconColor="text-primary"
            />
            <StatisticsCard
              value={total}
              label="Pendientes de Inicio"
              icon={<Truck className="w-6 h-6" />}
              iconBgColor="bg-warning/10"
              iconColor="text-warning"
            />
            <StatisticsCard
              value={
                operations.filter((op) => {
                  const startDate = new Date(op.operation.scheduledStartDate);
                  const now = new Date();
                  const diff = startDate.getTime() - now.getTime();
                  const hours = diff / (1000 * 60 * 60);
                  return hours >= 0 && hours <= 24;
                }).length
              }
              label="Próximas 24hrs"
              icon={<CheckCircle className="w-6 h-6" />}
              iconBgColor="bg-success/10"
              iconColor="text-success"
            />
          </div>
        )}

        {/* Operations Table or Calendar */}
        {viewMode === "calendar" ? (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Package className="w-5 h-5 text-secondary" />
                  Calendario de Operaciones
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Vista mensual de operaciones programadas
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-muted-foreground mt-4">
                    Cargando operaciones...
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                  <p className="text-destructive">{error}</p>
                </div>
              ) : (
                renderCalendarView()
              )}
            </CardContent>
          </Card>
        ) : (
          (() => {
            // Define table columns
            const columns: DataTableColumn<OperationWithDetails>[] = [
              {
                key: "operationNumber",
                header: "Nº Operación",
                accessor: (op) => (
                  <div>
                    <div className="font-medium text-foreground font-mono">
                      {op.operation.operationNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {op.operation.id}
                    </div>
                  </div>
                ),
              },
              {
                key: "type",
                header: "Tipo",
                accessor: (op) => (
                  <span className="text-sm text-foreground">
                    {getOperationTypeLabel(op.operation.operationType)}
                  </span>
                ),
              },
              {
                key: "route",
                header: "Origen → Destino",
                accessor: (op) => (
                  <div className="space-y-0.5">
                    <div className="text-sm text-foreground">
                      {op.operation.origin}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="text-muted-foreground/70">↓</span>
                      <span>{op.operation.destination}</span>
                    </div>
                  </div>
                ),
              },
              {
                key: "client",
                header: "Cliente",
                accessor: (op) =>
                  op.client ? (
                    <div className="text-sm">
                      <div className="text-foreground">
                        {op.client.businessName}
                      </div>
                      {op.client.industry && (
                        <div className="text-xs text-muted-foreground">
                          {op.client.industry}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Sin cliente
                    </span>
                  ),
              },
              {
                key: "assignments",
                header: "Vehículo / Chofer",
                accessor: (op) => (
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-foreground">
                      {op.vehicle.plateNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {op.driver.firstName} {op.driver.lastName}
                    </div>
                  </div>
                ),
              },
              {
                key: "scheduledDate",
                header: "Fecha Programada",
                accessor: (op) => {
                  const formatDateParts = (dateString?: string | null) => {
                    if (!dateString) return null;
                    const date = new Date(dateString);
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const year = date.getFullYear();
                    const hours = date.getHours();
                    const minutes = String(date.getMinutes()).padStart(2, "0");
                    const ampm = hours >= 12 ? "p.m." : "a.m.";
                    const formattedHours = hours % 12 || 12;
                    return {
                      date: `${day}-${month}-${year}`,
                      time: `${formattedHours}:${minutes} ${ampm}`,
                    };
                  };

                  const startParts = formatDateParts(
                    op.operation.scheduledStartDate
                  );
                  const endParts = formatDateParts(
                    op.operation.scheduledEndDate
                  );

                  return (
                    <div className="space-y-2">
                      {startParts && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Desde:
                          </div>
                          <div className="text-sm text-foreground">
                            {startParts.date}
                          </div>
                          <div className="text-sm text-foreground">
                            {startParts.time}
                          </div>
                        </div>
                      )}
                      {endParts && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Hasta:
                          </div>
                          <div className="text-sm text-foreground">
                            {endParts.date}
                          </div>
                          <div className="text-sm text-foreground">
                            {endParts.time}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                },
              },
              {
                key: "status",
                header: "Estado",
                accessor: (op) => getStatusBadge(op.operation.status),
              },
            ];

            // Define table actions
            const actions: DataTableAction<OperationWithDetails>[] = [
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

            // Row click handler
            const handleRowClick = (op: OperationWithDetails) => {
              router.push(`/operations/${op.operation.id}`);
            };

            // Define filters
            const tableFilters: DataTableFilter[] = [
              {
                id: "filter-type",
                label: "Tipo de Operación",
                type: "select",
                value: filterState.type,
                onChange: (value) => setFilter("type", value),
                options: [
                  { value: "all", label: "Todos los tipos" },
                  ...OperationTypes.map((type) => ({
                    value: type.value,
                    label: type.label,
                  })),
                ],
                ariaLabel: "Filtrar por tipo de operación",
              },
              {
                id: "filter-client",
                label: "Cliente",
                type: "select",
                value: filterState.client,
                onChange: (value) => setFilter("client", value),
                options: [
                  { value: "all", label: "Todos los clientes" },
                  ...clients.map((client) => ({
                    value: client.id.toString(),
                    label: client.businessName,
                  })),
                ],
                ariaLabel: "Filtrar por cliente",
              },
              {
                id: "filter-provider",
                label: "Proveedor",
                type: "select",
                value: filterState.provider,
                onChange: (value) => setFilter("provider", value),
                options: [
                  { value: "all", label: "Todos los proveedores" },
                  ...providers.map((provider) => ({
                    value: provider.id.toString(),
                    label: provider.businessName,
                  })),
                ],
                ariaLabel: "Filtrar por proveedor",
              },
            ];

            const handleClearFilters = () => {
              setSearch("");
              clearAllFilters();
              setDateRangeFilter({ start: "", end: "" });
              setPage(1);
            };

            const formatDateFilter = () => {
              if (!dateRangeFilter.start) return null;

              const startDate = new Date(dateRangeFilter.start);
              const endDate = dateRangeFilter.end
                ? new Date(dateRangeFilter.end)
                : startDate;

              // Check if it's the same day
              const isSameDay =
                startDate.getDate() === endDate.getDate() &&
                startDate.getMonth() === endDate.getMonth() &&
                startDate.getFullYear() === endDate.getFullYear();

              if (isSameDay) {
                // Compact format for single day
                return new Intl.DateTimeFormat("es-CL", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(startDate);
              } else {
                return `${new Intl.DateTimeFormat("es-CL", {
                  day: "numeric",
                  month: "short",
                }).format(startDate)} - ${new Intl.DateTimeFormat("es-CL", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(endDate)}`;
              }
            };

            const hasDateFilter = dateRangeFilter.start || dateRangeFilter.end;
            const activeFiltersCount = [
              filterState.type !== "all",
              filterState.client !== "all",
              filterState.provider !== "all",
              hasDateFilter,
            ].filter(Boolean).length;

            return (
              <>
                {/* Active Filters Badges */}
                {activeFiltersCount > 0 && (
                  <div className="flex flex-wrap items-center gap-2 px-1 py-2">
                    <span className="text-sm text-muted-foreground font-medium">
                      Filtros activos:
                    </span>
                    {hasDateFilter && formatDateFilter() && (
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/50 hover:bg-primary/20 cursor-pointer group"
                        onClick={() => {
                          setDateRangeFilter({ start: "", end: "" });
                          setPage(1);
                        }}
                      >
                        <Calendar className="h-3 w-3 mr-1.5" />
                        {formatDateFilter()}
                        <X className="h-3 w-3 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Badge>
                    )}
                    {filterState.type !== "all" && (
                      <Badge
                        variant="outline"
                        className="bg-secondary/10 text-secondary border-secondary/50"
                      >
                        {OperationTypes.find(
                          (t) => t.value === filterState.type
                        )?.label || filterState.type}
                      </Badge>
                    )}
                    {filterState.client !== "all" && (
                      <Badge
                        variant="outline"
                        className="bg-secondary/10 text-secondary border-secondary/50"
                      >
                        {clients.find(
                          (c) => c.id.toString() === filterState.client
                        )?.businessName || "Cliente"}
                      </Badge>
                    )}
                    {filterState.provider !== "all" && (
                      <Badge
                        variant="outline"
                        className="bg-secondary/10 text-secondary border-secondary/50"
                      >
                        {providers.find(
                          (p) => p.id.toString() === filterState.provider
                        )?.businessName || "Proveedor"}
                      </Badge>
                    )}
                    {activeFiltersCount > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Limpiar todos
                      </Button>
                    )}
                  </div>
                )}
                <DataTable
                  data={operations}
                  columns={columns}
                  pagination={pagination}
                  onPageChange={setPage}
                  searchValue={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Buscar por número de operación, origen, destino..."
                  onSearchSubmit={handleSearch}
                  filters={tableFilters}
                  showFilters={showFilters}
                  onToggleFilters={toggleFilters}
                  onClearFilters={handleClearFilters}
                  actions={actions}
                  onRowClick={handleRowClick}
                  loading={loading}
                  error={error}
                  lastUpdate={lastUpdate}
                  onRefresh={handleRefresh}
                  onExport={() => {
                    /* TODO: Implement export functionality */
                  }}
                  title="Listado de Operaciones"
                  description={`Total de ${total} operaciones registradas`}
                  icon={<Package className="w-5 h-5 text-secondary" />}
                  getRowKey={(op) => op.operation.id}
                  emptyState={
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No se encontraron operaciones
                      </p>
                      <Button
                        onClick={handleCreateClick}
                        className="mt-4 bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Programar Primera Operación
                      </Button>
                    </div>
                  }
                />
              </>
            );
          })()
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={operationToDelete?.operation.operationNumber}
        itemType="operación"
      />

      {/* Create/Edit Operation Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setOperationToEdit(null);
            setError(null); // Clear error when closing dialog
          }
        }}
      >
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editDialogOpen
                ? "Editar Operación"
                : "Nueva Programación de Operación"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editDialogOpen
                ? "Actualiza la información de la operación"
                : "Completa la información para programar una nueva operación"}
            </DialogDescription>
          </DialogHeader>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-sm text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Operation Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Información de la Operación
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {!editDialogOpen && (
                  <div className="col-span-2">
                    <Label
                      htmlFor="operationNumber"
                      className="text-foreground"
                    >
                      Número de Operación *
                    </Label>
                    <Input
                      id="operationNumber"
                      value={formData.operationNumber || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          operationNumber: e.target.value,
                        })
                      }
                      required
                      className="bg-ui-surface-elevated border-border text-foreground mt-1"
                      placeholder="OP-12345"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="operationType" className="text-foreground">
                    Tipo de Operación *
                  </Label>
                  <Select
                    value={formData.operationType || "delivery"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        operationType:
                          value as (typeof OperationTypes)[number]["value"],
                      })
                    }
                  >
                    <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {OperationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editDialogOpen && (
                  <div>
                    <Label htmlFor="status" className="text-foreground">
                      Estado
                    </Label>
                    <Select
                      value={formData.status || "scheduled"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          status:
                            value as (typeof OperationStatuses)[number]["value"],
                        })
                      }
                    >
                      <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {OperationStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Route Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Detalles del Traslado
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origin" className="text-foreground">
                    Origen *
                  </Label>
                  <Input
                    id="origin"
                    value={formData.origin || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, origin: e.target.value })
                    }
                    required
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Ej: Bodega Central, Santiago"
                  />
                </div>

                <div>
                  <Label htmlFor="destination" className="text-foreground">
                    Destino *
                  </Label>
                  <Input
                    id="destination"
                    value={formData.destination || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, destination: e.target.value })
                    }
                    required
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Ej: Faena Minera, Antofagasta"
                  />
                </div>

                <div>
                  <Label htmlFor="routeId" className="text-foreground">
                    Tramo/Ruta Asociada
                  </Label>
                  <Select
                    value={formData.routeId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        routeId:
                          value && value !== "none"
                            ? parseInt(value)
                            : undefined,
                      })
                    }
                  >
                    <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                      <SelectValue placeholder="Seleccionar ruta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin ruta asignada</SelectItem>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id.toString()}>
                          {route.name} ({route.origin} → {route.destination})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="distance" className="text-foreground">
                    Distancia (km)
                  </Label>
                  <Input
                    id="distance"
                    type="number"
                    value={formData.distance || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        distance: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Programación
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="scheduledStartDate"
                    className="text-foreground"
                  >
                    Fecha y Hora de Inicio *
                  </Label>
                  <Input
                    id="scheduledStartDate"
                    type="datetime-local"
                    value={formData.scheduledStartDate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledStartDate: e.target.value,
                      })
                    }
                    required
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="scheduledEndDate" className="text-foreground">
                    Fecha y Hora de Término
                  </Label>
                  <Input
                    id="scheduledEndDate"
                    type="datetime-local"
                    value={formData.scheduledEndDate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledEndDate: e.target.value,
                      })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Assignments */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Asignaciones
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId" className="text-foreground">
                    Cliente
                  </Label>
                  <Select
                    value={formData.clientId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        clientId:
                          value && value !== "none"
                            ? parseInt(value)
                            : undefined,
                      })
                    }
                  >
                    <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cliente</SelectItem>
                      {clients.map((client) => (
                        <SelectItem
                          key={client.id}
                          value={client.id.toString()}
                        >
                          {client.businessName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="providerId" className="text-foreground">
                    Proveedor de Transporte
                  </Label>
                  <Select
                    value={formData.providerId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        providerId:
                          value && value !== "none"
                            ? parseInt(value)
                            : undefined,
                      })
                    }
                  >
                    <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin proveedor</SelectItem>
                      {providers.map((provider) => (
                        <SelectItem
                          key={provider.id}
                          value={provider.id.toString()}
                        >
                          {provider.businessName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="driverId" className="text-foreground">
                    Chofer *
                  </Label>
                  <Select
                    value={formData.driverId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        driverId: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                      <SelectValue placeholder="Seleccionar chofer" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem
                          key={driver.id}
                          value={driver.id.toString()}
                        >
                          {driver.firstName} {driver.lastName} - {driver.rut}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicleId" className="text-foreground">
                    Vehículo *
                  </Label>
                  <Select
                    value={formData.vehicleId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        vehicleId: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                      <SelectValue placeholder="Seleccionar vehículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem
                          key={vehicle.id}
                          value={vehicle.id.toString()}
                        >
                          {vehicle.plateNumber} - {vehicle.brand}{" "}
                          {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Cargo Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Detalles de la Carga
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="cargoDescription" className="text-foreground">
                    Descripción de la Carga / Maquinaria
                  </Label>
                  <Textarea
                    id="cargoDescription"
                    value={formData.cargoDescription || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cargoDescription: e.target.value,
                      })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Ej: Excavadora Caterpillar 320D, código: EXC-001"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="cargoWeight" className="text-foreground">
                    Peso de la Carga (kg)
                  </Label>
                  <Input
                    id="cargoWeight"
                    type="number"
                    value={formData.cargoWeight || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cargoWeight: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Observaciones y Notas
              </h3>

              <div>
                <Label htmlFor="notes" className="text-foreground">
                  Notas y Condiciones Especiales
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  placeholder="Instrucciones especiales, condiciones del lugar, requisitos de seguridad..."
                  rows={4}
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
                  setOperationToEdit(null);
                }}
                className="border-border text-foreground hover:bg-ui-surface-elevated"
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : editDialogOpen ? (
                  "Actualizar Operación"
                ) : (
                  "Programar Operación"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
