"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser, isAuthenticated } from "@/lib/auth";
import { EditOperationModal } from "@/components/dashboard/EditOperationModal";
import { api } from "@/lib/client-api";
import type {
  DashboardFilters,
  DashboardFilterOptions,
  LiveOperation,
} from "@/types/dashboard";
import type { OperationWithDetails } from "@/types/operations";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableAction,
} from "@/components/ui/data-table";
import { Eye, Edit as EditIcon } from "lucide-react";

// Status configuration
const statusConfig: Record<
  string,
  { label: string; className: string; icon: string }
> = {
  scheduled: {
    label: "Programada",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: "📅",
  },
  confirmed: {
    label: "Confirmada",
    className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    icon: "✓",
  },
  "in-progress": {
    label: "En Tránsito",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    icon: "🚚",
  },
  completed: {
    label: "Completada",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: "✓✓",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: "✕",
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false); // Track loading state to prevent concurrent requests
  const [operations, setOperations] = useState<LiveOperation[]>([]);
  const [editingOperation, setEditingOperation] =
    useState<LiveOperation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const lastFetchTimeRef = useRef<number>(Date.now());
  const [filterOptionsLoaded, setFilterOptionsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<DashboardFilters>({
    search: null,
    status: null,
    operationType: null,
    clientId: null,
    providerId: null,
    vehicleId: null,
    startDate: null,
    endDate: null,
  });

  // Keep a ref to latest filters to avoid stale closures
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  const [filterOptions, setFilterOptions] = useState<DashboardFilterOptions>({
    clients: [],
    providers: [],
    routes: [],
    drivers: [],
    vehicles: [],
    statuses: [
      { value: "scheduled", label: "Programada" },
      { value: "confirmed", label: "Confirmada" },
      { value: "in-progress", label: "En Tránsito" },
      { value: "completed", label: "Completada" },
      { value: "cancelled", label: "Cancelada" },
    ],
    operationTypes: [
      { value: "delivery", label: "Entrega" },
      { value: "pickup", label: "Retiro" },
      { value: "transfer", label: "Traslado" },
      { value: "transport", label: "Transporte" },
      { value: "service", label: "Servicio" },
    ],
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
  }, [router]);

  // Memoize user to prevent unnecessary re-renders
  const user = useMemo(() => getUser(), []);

  // Calculate stats from operations - memoized to prevent unnecessary recalculations
  const stats = useMemo(
    () => ({
      totalOperations: operations.length,
      activeOperations: operations.filter(
        (o) =>
          o.operation.status === "scheduled" ||
          o.operation.status === "confirmed" ||
          o.operation.status === "in-progress"
      ).length,
      inTransit: operations.filter((o) => o.operation.status === "in-progress")
        .length,
      pendingClosure: operations.filter(
        (o) =>
          o.operation.status === "confirmed" ||
          o.operation.status === "scheduled"
      ).length,
      completed: operations.filter((o) => o.operation.status === "completed")
        .length,
      statusBreakdown: {
        scheduled: operations.filter((o) => o.operation.status === "scheduled")
          .length,
        confirmed: operations.filter((o) => o.operation.status === "confirmed")
          .length,
        inProgress: operations.filter(
          (o) => o.operation.status === "in-progress"
        ).length,
        completed: operations.filter((o) => o.operation.status === "completed")
          .length,
        cancelled: operations.filter((o) => o.operation.status === "cancelled")
          .length,
      },
    }),
    [operations]
  );

  // Refresh operations function
  const refreshOperations = useCallback(async () => {
    if (!user || loadingRef.current) return; // Prevent concurrent requests

    loadingRef.current = true;
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        operatorId: user.operatorId,
        page: 1,
        limit: 100, // Fetch up to 100 operations per page
      };

      // Apply filters from ref to get latest values
      const currentFilters = filtersRef.current;
      if (currentFilters.clientId) params.clientId = currentFilters.clientId;
      if (currentFilters.providerId)
        params.providerId = currentFilters.providerId;
      if (currentFilters.vehicleId) params.vehicleId = currentFilters.vehicleId;
      if (currentFilters.status) params.status = currentFilters.status;
      if (currentFilters.operationType)
        params.operationType = currentFilters.operationType;
      if (currentFilters.startDate) params.startDate = currentFilters.startDate;
      if (currentFilters.endDate) params.endDate = currentFilters.endDate;

      const response = await api.operations.list(params as any);

      // Convert to LiveOperation format
      // Handle both old format (items) and new format (data)
      const items = (response as any).items || response.data || [];
      const liveOps: LiveOperation[] = items.map(
        (op: OperationWithDetails) => ({
          ...op,
          currentStatus:
            op.operation.status === "in-progress"
              ? "in-transit"
              : op.operation.status === "scheduled"
              ? "pending"
              : "completed",
          lastUpdate: new Date().toISOString(),
          actualProgress:
            op.operation.status === "in-progress"
              ? Math.floor(Math.random() * 100)
              : undefined,
          estimatedArrival:
            op.operation.status === "in-progress"
              ? new Date(Date.now() + Math.random() * 3600000).toISOString()
              : null,
          delayMinutes:
            Math.random() > 0.8 ? Math.floor(Math.random() * 60) : 0,
          incidents: [],
        })
      );

      setOperations(liveOps);
      lastFetchTimeRef.current = Date.now();
    } catch (error) {
      console.error("Error loading operations:", error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [user]);

  // Handle window focus/blur for smart refetching
  useEffect(() => {
    if (!mounted) return;

    let wasHidden = false;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHidden = true;
      } else if (wasHidden) {
        // Window regained focus - check if we should refresh
        const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
        const REFETCH_THRESHOLD = 30000; // 30 seconds

        if (timeSinceLastFetch > REFETCH_THRESHOLD) {
          console.log("Refreshing data after window focus...");
          // Call refresh directly without relying on the callback
          if (user) {
            refreshOperations();
          }
        }
        wasHidden = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // Only depend on mounted - we'll access current values directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, refreshOperations]);

  // Load filter options (only once)
  useEffect(() => {
    if (!mounted || !user || filterOptionsLoaded) return;

    let isMounted = true;

    const loadFilterOptions = async () => {
      try {
        const [clientsRes, providersRes, vehiclesRes, routesRes] =
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
            api.vehicles.list({
              status: true,
              limit: 100,
            }),
            api.routes.list({
              status: true,
              limit: 100,
            }),
          ]);

        if (!isMounted) return;

        setFilterOptions((prev) => ({
          ...prev,
          clients: (clientsRes.data || (clientsRes as any).items || []).map(
            (c: { id: number; businessName: string }) => ({
              value: c.id,
              label: c.businessName,
            })
          ),
          providers: (
            providersRes.data ||
            (providersRes as any).items ||
            []
          ).map((p: { id: number; businessName: string }) => ({
            value: p.id,
            label: p.businessName,
          })),
          vehicles: (vehiclesRes.data || (vehiclesRes as any).items || []).map(
            (v: { id: number; plateNumber: string }) => ({
              value: v.id,
              label: v.plateNumber,
            })
          ),
          routes: (routesRes.data || (routesRes as any).items || []).map(
            (r: {
              id: number;
              name: string;
              origin: string;
              destination: string;
            }) => ({
              value: r.id,
              label: `${r.name} (${r.origin} → ${r.destination})`,
            })
          ),
        }));
        setFilterOptionsLoaded(true);
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };

    loadFilterOptions();

    return () => {
      isMounted = false;
    };
  }, [mounted, user, filterOptionsLoaded]);

  // Initial load and filter change handler
  useEffect(() => {
    if (!mounted || !user) return;
    refreshOperations();
  }, [
    mounted,
    user,
    refreshOperations,
    filters.clientId,
    filters.providerId,
    filters.vehicleId,
    filters.status,
    filters.operationType,
    filters.startDate,
    filters.endDate,
  ]);

  const handleOperationClick = useCallback(
    (operation: LiveOperation) => {
      router.push(`/operations/${operation.operation.id}`);
    },
    [router]
  );

  const handleEditClick = useCallback(
    (operation: LiveOperation, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingOperation(operation);
      setIsEditModalOpen(true);
    },
    []
  );

  const handleEditSuccess = useCallback(() => {
    refreshOperations();
    setIsEditModalOpen(false);
    setEditingOperation(null);
  }, [refreshOperations]);

  const handleFilterChange = (
    key: keyof DashboardFilters,
    value: string | number | null
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || null,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: null,
      status: null,
      operationType: null,
      clientId: null,
      providerId: null,
      vehicleId: null,
      startDate: null,
      endDate: null,
    });
    setSearchQuery("");
  };

  // Filter operations based on search - memoized to prevent unnecessary recalculations
  const filteredOperations = useMemo(() => {
    if (!searchQuery) return operations;
    const search = searchQuery.toLowerCase();
    return operations.filter(
      (op) =>
        op.operation.operationNumber.toLowerCase().includes(search) ||
        op.operation.origin.toLowerCase().includes(search) ||
        op.operation.destination.toLowerCase().includes(search) ||
        op.client?.businessName.toLowerCase().includes(search) ||
        op.provider?.businessName.toLowerCase().includes(search) ||
        op.vehicle.plateNumber.toLowerCase().includes(search)
    );
  }, [operations, searchQuery]);

  const activeFiltersCount = useMemo(
    () =>
      Object.values(filters).filter(
        (value) => value !== null && value !== undefined && value !== ""
      ).length,
    [filters]
  );

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-surface-elevated">
        <p className="text-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Administración y Control de Operaciones
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Active Operations */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-200 hover:scale-[1.02]">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Operaciones Activas
                  </p>
                  <p className="text-3xl font-bold text-foreground mb-1 leading-none">
                    {stats.activeOperations}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-blue-500">
                    <svg
                      className="w-3 h-3 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    <span className="truncate">
                      Total de {stats.totalOperations} registradas
                    </span>
                  </div>
                </div>
                <div className="p-2.5 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Transit - HIGHLIGHTED AS CRITICAL */}
          <Card className="bg-gradient-to-br from-yellow-500/15 to-yellow-600/5 border-yellow-500/30 hover:shadow-md hover:shadow-yellow-500/20 transition-all duration-200 hover:scale-[1.02] ring-1 ring-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-1.5 flex items-center gap-1">
                    En Tránsito
                    <span className="inline-flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-500"></span>
                    </span>
                  </p>
                  <p className="text-3xl font-bold text-foreground mb-1 leading-none">
                    {stats.inTransit}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-yellow-500 font-medium">
                    <svg
                      className="w-3 h-3 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span className="truncate">Operaciones en curso</span>
                  </div>
                </div>
                <div className="p-2.5 bg-yellow-500/30 rounded-lg flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Closure */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:shadow-md hover:shadow-purple-500/10 transition-all duration-200 hover:scale-[1.02]">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Pendientes de Cierre
                  </p>
                  <p className="text-3xl font-bold text-foreground mb-1 leading-none">
                    {stats.pendingClosure}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-purple-500">
                    <svg
                      className="w-3 h-3 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="truncate">Por confirmar o iniciar</span>
                  </div>
                </div>
                <div className="p-2.5 bg-purple-500/20 rounded-lg flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-purple-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:shadow-md hover:shadow-green-500/10 transition-all duration-200 hover:scale-[1.02]">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Completadas
                  </p>
                  <p className="text-3xl font-bold text-foreground mb-1 leading-none">
                    {stats.completed}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-green-500">
                    <svg
                      className="w-3 h-3 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="truncate">Operaciones finalizadas</span>
                  </div>
                </div>
                <div className="p-2.5 bg-green-500/20 rounded-lg flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operations Table with Integrated Filters */}
        {(() => {
          // Define table columns
          const columns: DataTableColumn<LiveOperation>[] = [
            {
              key: "operation",
              header: "Operación",
              accessor: (operation) => (
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {operation.operation.operationNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(
                      operation.operation.scheduledStartDate
                    ).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ),
            },
            {
              key: "client",
              header: "Cliente",
              accessor: (operation) => (
                <span className="text-sm text-foreground">
                  {operation.client?.businessName || "Sin cliente"}
                </span>
              ),
            },
            {
              key: "provider",
              header: "Proveedor",
              accessor: (operation) => (
                <span className="text-sm text-foreground">
                  {operation.provider?.businessName || "Sin proveedor"}
                </span>
              ),
            },
            {
              key: "route",
              header: "Ruta",
              accessor: (operation) => (
                <div className="flex flex-col max-w-xs">
                  <span className="text-sm text-foreground truncate">
                    {operation.operation.origin}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                    <span className="truncate">
                      {operation.operation.destination}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              key: "vehicle",
              header: "Vehículo",
              accessor: (operation) => (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {operation.vehicle.plateNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {operation.vehicle.brand} {operation.vehicle.model}
                  </span>
                </div>
              ),
            },
            {
              key: "status",
              header: "Estado",
              accessor: (operation) => {
                const status =
                  statusConfig[operation.operation.status] ||
                  statusConfig.scheduled;
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${status.className}`}
                  >
                    <span>{status.icon}</span>
                    {status.label}
                  </span>
                );
              },
            },
          ];

          // Define table actions
          const actions: DataTableAction<LiveOperation>[] = [
            {
              label: "Ver detalles",
              icon: <Eye className="h-5 w-5" />,
              onClick: (operation) => handleOperationClick(operation),
              className:
                "text-muted-foreground hover:text-primary hover:bg-primary/10",
              title: "Ver detalles",
            },
            {
              label: "Editar asignaciones",
              icon: <EditIcon className="h-5 w-5" />,
              onClick: (operation) => {
                const syntheticEvent = {
                  stopPropagation: () => {},
                } as React.MouseEvent;
                handleEditClick(operation, syntheticEvent);
              },
              className:
                "text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10",
              title: "Editar asignaciones",
            },
          ];

          // Define filters
          const tableFilters: DataTableFilter[] = [
            {
              id: "filter-status",
              label: "Estado",
              type: "select",
              value: filters.status || "all",
              onChange: (value) =>
                handleFilterChange("status", value === "all" ? null : value),
              options: [
                { value: "all", label: "Todos los estados" },
                ...filterOptions.statuses.map((option) => ({
                  value: String(option.value),
                  label: option.label,
                })),
              ],
              ariaLabel: "Filtrar por estado de operación",
            },
            {
              id: "filter-client",
              label: "Cliente",
              type: "select",
              value: filters.clientId?.toString() || "all",
              onChange: (value) =>
                handleFilterChange(
                  "clientId",
                  value === "all" ? null : Number(value)
                ),
              options: [
                { value: "all", label: "Todos los clientes" },
                ...filterOptions.clients.map((option) => ({
                  value: String(option.value),
                  label: option.label,
                })),
              ],
              ariaLabel: "Filtrar por cliente",
            },
            {
              id: "filter-provider",
              label: "Proveedor",
              type: "select",
              value: filters.providerId?.toString() || "all",
              onChange: (value) =>
                handleFilterChange(
                  "providerId",
                  value === "all" ? null : Number(value)
                ),
              options: [
                { value: "all", label: "Todos los proveedores" },
                ...filterOptions.providers.map((option) => ({
                  value: option.value.toString(),
                  label: option.label,
                })),
              ],
              ariaLabel: "Filtrar por proveedor",
            },
            {
              id: "filter-vehicle",
              label: "Maquinaria / Vehículo",
              type: "select",
              value: filters.vehicleId?.toString() || "all",
              onChange: (value) =>
                handleFilterChange(
                  "vehicleId",
                  value === "all" ? null : Number(value)
                ),
              options: [
                { value: "all", label: "Todos los vehículos" },
                ...filterOptions.vehicles.map((option) => ({
                  value: option.value.toString(),
                  label: option.label,
                })),
              ],
              ariaLabel: "Filtrar por vehículo o maquinaria",
            },
          ];

          return (
            <DataTable
              data={filteredOperations}
              columns={columns}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Buscar por número, origen, destino, cliente, proveedor, vehículo..."
              filters={tableFilters}
              showFilters={true}
              onClearFilters={clearFilters}
              actions={actions}
              loading={loading}
              error={null}
              title="Operaciones"
              description={`${filteredOperations.length} resultados`}
              icon={
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              }
              lastUpdate={new Date(lastFetchTimeRef.current)}
              onRefresh={refreshOperations}
              onExport={() => {
                /* TODO: Implement export functionality */
              }}
              getRowKey={(operation) => operation.operation.id}
              emptyState={
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <svg
                    className="w-20 h-20 mb-4 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-xl font-medium mb-2">
                    No se encontraron operaciones
                  </p>
                  <p className="text-sm">
                    Intenta ajustar los filtros de búsqueda
                  </p>
                </div>
              }
            />
          );
        })()}
      </div>

      {/* Edit Operation Modal */}
      <EditOperationModal
        operation={editingOperation}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingOperation(null);
        }}
        onSuccess={handleEditSuccess}
        clients={filterOptions.clients}
        providers={filterOptions.providers}
        routes={filterOptions.routes}
        vehicles={filterOptions.vehicles}
      />
    </main>
  );
}
