"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import {
  getOperations,
  deleteOperation,
  createOperation,
  updateOperation,
  getClients,
  getProviders,
  getDrivers,
  getVehicles,
  getRoutes,
} from "@/lib/api";
import type {
  OperationWithDetails,
  OperationQueryParams,
  CreateOperationInput,
  UpdateOperationInput,
} from "@/types/operations";
import type { Client } from "@/types/clients";
import type { Provider } from "@/types/providers";
import type { Driver } from "@/types/drivers";
import type { Vehicle } from "@/types/drivers";
import type { Route } from "@/types/routes";
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
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Filter,
  Download,
  TrendingUp,
  Calendar,
  Truck,
  MapPin,
  Clock,
  Users,
  Package,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<Record<string, any>>({
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    start: string;
    end: string;
  }>({ start: "", end: "" });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Last update timestamp
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchCatalogs();
    fetchOperations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, clientFilter, providerFilter, viewMode, currentMonth]);

  const fetchCatalogs = async () => {
    try {
      const token = getToken();
      const user = getUser();
      if (!token || !user) return;

      const [clientsRes, providersRes, driversRes, vehiclesRes, routesRes] =
        await Promise.all([
          getClients(token, {
            operatorId: user.operatorId,
            status: true,
            limit: 1000,
          }),
          getProviders(token, {
            operatorId: user.operatorId,
            status: true,
            limit: 1000,
          }),
          getDrivers(token, {
            operatorId: user.operatorId,
            status: true,
            limit: 1000,
          }),
          getVehicles(token, {
            status: true,
            limit: 1000,
          }),
          getRoutes(token, { status: true, limit: 1000 }),
        ]);

      setClients(clientsRes.data);
      setProviders(providersRes.data);
      setDrivers(driversRes.data);
      setVehicles(vehiclesRes.data);
      setRoutes(routesRes.data);
    } catch (err) {
      console.error("Error loading catalogs:", err);
    }
  };

  const fetchOperations = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const user = getUser();
      if (!token || !user) {
        router.push("/login");
        return;
      }

      const params: OperationQueryParams = {
        operatorId: user.operatorId,
        page,
        limit: viewMode === "calendar" ? 1000 : limit, // Fetch all for calendar view
        status: "scheduled", // Only fetch programmed operations
      };

      if (search) params.search = search;
      if (typeFilter !== "all") params.operationType = typeFilter;
      if (clientFilter !== "all") params.clientId = parseInt(clientFilter);
      if (providerFilter !== "all")
        params.providerId = parseInt(providerFilter);

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

      const response = await getOperations(token, params);
      setOperations(response.data);
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
    setIsRefreshing(true);
    await fetchOperations();
    setIsRefreshing(false);
  };

  const handleDeleteClick = (operation: OperationWithDetails) => {
    setOperationToDelete(operation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!operationToDelete) return;

    try {
      const token = getToken();
      if (!token) return;

      await deleteOperation(token, operationToDelete.operation.id);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      operationType: operation.operation.operationType as any,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: operation.operation.status as any,
      notes: operation.operation.notes || "",
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

      if (editDialogOpen && operationToEdit) {
        // Update existing operation
        // Convert string IDs to numbers
        const updateData: UpdateOperationInput = {
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
          status: formData.status,
          cargoDescription: formData.cargoDescription || undefined,
          cargoWeight: formData.cargoWeight
            ? Number(formData.cargoWeight)
            : undefined,
          notes: formData.notes || undefined,
        };
        await updateOperation(token, operationToEdit.operation.id, updateData);
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
        const createData: CreateOperationInput = {
          operatorId: user.operatorId,
          operationNumber: formData.operationNumber,
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
        await createOperation(token, createData);
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

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
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

  const isSameDate = (date1: Date | null, date2: Date) => {
    if (!date1) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
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
      <div className="space-y-4">
        {/* Calendar Header with Filters */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-foreground capitalize">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Tipo de Operación
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
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
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Cliente
              </label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
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
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Proveedor
              </label>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
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
                className="p-3 text-center text-sm font-semibold text-muted-foreground"
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
                  const selected = isSameDate(selectedDate, date);

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => setSelectedDate(date)}
                      className={`min-h-[120px] p-2 cursor-pointer transition-colors ${
                        !isCurrentMonth
                          ? "bg-ui-surface-elevated/50"
                          : "bg-card hover:bg-ui-surface-elevated"
                      } ${selected ? "ring-2 ring-purple-500" : ""}`}
                    >
                      <div className="flex flex-col h-full">
                        <div
                          className={`text-sm font-medium mb-1 ${
                            todayCheck
                              ? "bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center"
                              : isCurrentMonth
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {date.getDate()}
                        </div>
                        <div className="flex-1 space-y-1 overflow-y-auto">
                          {dayOperations.slice(0, 3).map((op) => (
                            <div
                              key={op.operation.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/operations/${op.operation.id}`);
                              }}
                              className="text-xs p-1 rounded bg-primary/10 border border-primary/50 hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                              <div className="font-medium text-primary truncate">
                                {new Date(
                                  op.operation.scheduledStartDate
                                ).toLocaleTimeString("es-CL", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="text-foreground truncate">
                                {op.operation.operationNumber}
                              </div>
                              <div className="text-muted-foreground truncate">
                                {op.operation.origin} →{" "}
                                {op.operation.destination}
                              </div>
                            </div>
                          ))}
                          {dayOperations.length > 3 && (
                            <div className="text-xs text-center text-muted-foreground font-medium">
                              +{dayOperations.length - 3} más
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                Operaciones del{" "}
                {new Intl.DateTimeFormat("es-CL", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }).format(selectedDate)}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {getOperationsForDate(selectedDate).length} operación(es)
                programada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getOperationsForDate(selectedDate).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay operaciones programadas para este día
                </p>
              ) : (
                <div className="space-y-3">
                  {getOperationsForDate(selectedDate).map((op) => (
                    <div
                      key={op.operation.id}
                      onClick={() =>
                        router.push(`/operations/${op.operation.id}`)
                      }
                      className="p-4 rounded-lg border border-border hover:bg-ui-surface-elevated cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className="border-secondary/50 text-secondary"
                            >
                              {getOperationTypeLabel(
                                op.operation.operationType
                              )}
                            </Badge>
                            <span className="font-mono font-medium text-foreground">
                              {op.operation.operationNumber}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Hora:{" "}
                              </span>
                              <span className="text-foreground">
                                {formatDateTime(
                                  op.operation.scheduledStartDate
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Cliente:{" "}
                              </span>
                              <span className="text-foreground">
                                {op.client?.businessName || "Sin cliente"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Origen:{" "}
                              </span>
                              <span className="text-foreground">
                                {op.operation.origin}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Destino:{" "}
                              </span>
                              <span className="text-foreground">
                                {op.operation.destination}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Chofer:{" "}
                              </span>
                              <span className="text-foreground">
                                {op.driver.firstName} {op.driver.lastName}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Vehículo:{" "}
                              </span>
                              <span className="text-foreground">
                                {op.vehicle.plateNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(op.operation.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(op);
                            }}
                            className="text-secondary hover:text-secondary hover:bg-secondary/10"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
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
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Operaciones Programadas
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {total}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      En Esta Página
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {totalScheduled}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Pendientes de Inicio
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {total}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Próximas 24hrs
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {
                        operations.filter((op) => {
                          const startDate = new Date(
                            op.operation.scheduledStartDate
                          );
                          const now = new Date();
                          const diff = startDate.getTime() - now.getTime();
                          const hours = diff / (1000 * 60 * 60);
                          return hours >= 0 && hours <= 24;
                        }).length
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Operations Table or Calendar */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-secondary" />
                {viewMode === "list"
                  ? "Listado de Operaciones"
                  : "Calendario de Operaciones"}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {viewMode === "list"
                  ? `Total de ${total} operaciones registradas`
                  : "Vista mensual de operaciones programadas"}
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
            ) : viewMode === "calendar" ? (
              renderCalendarView()
            ) : (
              <>
                {/* Integrated Filters for List View */}
                <div className="space-y-4 mb-6">
                  {/* Search Bar with Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <label htmlFor="search-operations" className="sr-only">
                        Buscar operaciones
                      </label>
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="search-operations"
                        placeholder="Buscar por número de operación, origen, destino..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-10 bg-ui-surface-elevated border-border text-foreground placeholder-muted-foreground focus:border-purple-500"
                        aria-label="Buscar operaciones por número, origen o destino"
                      />
                    </div>
                    <Button
                      onClick={handleSearch}
                      className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
                      aria-label="Ejecutar búsqueda"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Buscar
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowFilters(!showFilters)}
                      className="border-border text-foreground hover:bg-ui-surface-elevated"
                      aria-label={
                        showFilters ? "Ocultar filtros" : "Mostrar filtros"
                      }
                      aria-expanded={showFilters}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRefresh}
                      disabled={loading || isRefreshing}
                      className="border-border text-foreground hover:bg-ui-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      aria-label="Actualizar lista de operaciones"
                    >
                      <Clock
                        className={`mr-2 h-4 w-4 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                      <span className="hidden sm:inline">Actualizar</span>
                    </Button>
                  </div>

                  {/* Additional Filters - Expandable */}
                  {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-ui-surface-elevated/50 rounded-lg border border-border">
                      <div>
                        <Label
                          htmlFor="filter-type"
                          className="text-xs font-medium text-muted-foreground mb-1.5 block"
                        >
                          Tipo de Operación
                        </Label>
                        <Select
                          value={typeFilter}
                          onValueChange={setTypeFilter}
                        >
                          <SelectTrigger
                            id="filter-type"
                            className="bg-ui-surface-elevated border-border text-foreground h-9"
                            aria-label="Filtrar por tipo de operación"
                          >
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
                        <Label
                          htmlFor="filter-client"
                          className="text-xs font-medium text-muted-foreground mb-1.5 block"
                        >
                          Cliente
                        </Label>
                        <Select
                          value={clientFilter}
                          onValueChange={setClientFilter}
                        >
                          <SelectTrigger
                            id="filter-client"
                            className="bg-ui-surface-elevated border-border text-foreground h-9"
                            aria-label="Filtrar por cliente"
                          >
                            <SelectValue placeholder="Cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              Todos los clientes
                            </SelectItem>
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
                        <Label
                          htmlFor="filter-provider"
                          className="text-xs font-medium text-muted-foreground mb-1.5 block"
                        >
                          Proveedor
                        </Label>
                        <Select
                          value={providerFilter}
                          onValueChange={setProviderFilter}
                        >
                          <SelectTrigger
                            id="filter-provider"
                            className="bg-ui-surface-elevated border-border text-foreground h-9"
                            aria-label="Filtrar por proveedor"
                          >
                            <SelectValue placeholder="Proveedor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              Todos los proveedores
                            </SelectItem>
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
                        <Label
                          htmlFor="filter-date-start"
                          className="text-xs font-medium text-muted-foreground mb-1.5 block"
                        >
                          Fecha Inicio
                        </Label>
                        <Input
                          id="filter-date-start"
                          type="date"
                          value={dateRangeFilter.start}
                          onChange={(e) =>
                            setDateRangeFilter({
                              ...dateRangeFilter,
                              start: e.target.value,
                            })
                          }
                          className="bg-ui-surface-elevated border-border text-foreground h-9"
                          aria-label="Filtrar por fecha de inicio"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="filter-date-end"
                          className="text-xs font-medium text-muted-foreground mb-1.5 block"
                        >
                          Fecha Fin
                        </Label>
                        <Input
                          id="filter-date-end"
                          type="date"
                          value={dateRangeFilter.end}
                          onChange={(e) =>
                            setDateRangeFilter({
                              ...dateRangeFilter,
                              end: e.target.value,
                            })
                          }
                          className="bg-ui-surface-elevated border-border text-foreground h-9"
                          aria-label="Filtrar por fecha de fin"
                        />
                      </div>
                    </div>
                  )}

                  {/* Last Update Timestamp */}
                  {lastUpdate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-ui-surface-elevated px-3 py-2 rounded-lg border border-border w-fit">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        Última actualización:{" "}
                        {lastUpdate.toLocaleTimeString("es-CL", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Table */}
                {operations.length === 0 ? (
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
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground">
                              Nº Operación
                            </TableHead>
                            <TableHead className="text-muted-foreground">
                              Tipo
                            </TableHead>
                            <TableHead className="text-muted-foreground">
                              Origen → Destino
                            </TableHead>
                            <TableHead className="text-muted-foreground">
                              Cliente
                            </TableHead>
                            <TableHead className="text-muted-foreground">
                              Vehículo / Chofer
                            </TableHead>
                            <TableHead className="text-muted-foreground">
                              Fecha Programada
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
                          {operations.map((op) => (
                            <TableRow
                              key={op.operation.id}
                              onClick={() =>
                                router.push(`/operations/${op.operation.id}`)
                              }
                              className="border-b border-border hover:bg-ui-surface-elevated cursor-pointer transition-colors"
                            >
                              <TableCell>
                                <div>
                                  <div className="font-medium text-foreground font-mono">
                                    {op.operation.operationNumber}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ID: {op.operation.id}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-secondary/50 text-secondary"
                                >
                                  {getOperationTypeLabel(
                                    op.operation.operationType
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-sm text-foreground">
                                    <MapPin className="w-3 h-3 text-success" />
                                    {op.operation.origin}
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-foreground">
                                    <MapPin className="w-3 h-3 text-destructive" />
                                    {op.operation.destination}
                                  </div>
                                  {op.operation.distance && (
                                    <div className="text-xs text-muted-foreground">
                                      {op.operation.distance} km
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {op.client ? (
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
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-sm text-foreground">
                                    <Truck className="w-3 h-3" />
                                    {op.vehicle.plateNumber}
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-foreground">
                                    <Users className="w-3 h-3" />
                                    {op.driver.firstName} {op.driver.lastName}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm text-foreground">
                                    {formatDateTime(
                                      op.operation.scheduledStartDate
                                    )}
                                  </div>
                                  {op.operation.scheduledEndDate && (
                                    <div className="text-xs text-muted-foreground">
                                      Hasta:{" "}
                                      {formatDateTime(
                                        op.operation.scheduledEndDate
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(op.operation.status)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/operations/${op.operation.id}`
                                      );
                                    }}
                                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    title="Ver detalles"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(op);
                                    }}
                                    className="text-muted-foreground hover:text-secondary hover:bg-secondary/10"
                                    title="Editar"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(op);
                                    }}
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
                        Mostrando {(page - 1) * limit + 1} a{" "}
                        {Math.min(page * limit, total)} de {total} operaciones
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
                                    ? "bg-purple-600 hover:bg-purple-700 text-white"
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
              ¿Estás seguro de que deseas eliminar la operación{" "}
              <strong className="text-foreground">
                {operationToDelete?.operation.operationNumber}
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
