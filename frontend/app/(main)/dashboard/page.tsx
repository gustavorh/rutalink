"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser, isAuthenticated, getToken } from "@/lib/auth";
import { EditOperationModal } from "@/components/dashboard/EditOperationModal";
import {
  getOperations,
  getClients,
  getProviders,
  getVehicles,
  getRoutes,
} from "@/lib/api";
import type {
  DashboardFilters,
  DashboardFilterOptions,
  LiveOperation,
} from "@/types/dashboard";
import type { OperationWithDetails } from "@/types/operations";

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

  // Memoize user and token to prevent unnecessary re-renders
  const user = useMemo(() => getUser(), []);
  const token = useMemo(() => getToken(), []);

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
    if (!token || !user || loadingRef.current) return; // Prevent concurrent requests

    loadingRef.current = true;
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        operatorId: user.operatorId,
        page: 1,
        limit: 1000, // Fetch up to 1000 operations (all operations)
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

      const response = await getOperations(token, params as never);

      // Convert to LiveOperation format
      const liveOps: LiveOperation[] = response.data.map(
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
  }, [token, user]);

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
          if (token && user) {
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
  }, [mounted]);

  // Load filter options (only once)
  useEffect(() => {
    if (!mounted || !token || !user || filterOptionsLoaded) return;

    let isMounted = true;

    const loadFilterOptions = async () => {
      try {
        const [clientsRes, providersRes, vehiclesRes, routesRes] =
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
            getVehicles(token, {
              status: true,
              limit: 1000,
            }),
            getRoutes(token, {
              status: true,
              limit: 1000,
            }),
          ]);

        if (!isMounted) return;

        setFilterOptions((prev) => ({
          ...prev,
          clients: clientsRes.data.map(
            (c: { id: number; businessName: string }) => ({
              value: c.id,
              label: c.businessName,
            })
          ),
          providers: providersRes.data.map(
            (p: { id: number; businessName: string }) => ({
              value: p.id,
              label: p.businessName,
            })
          ),
          vehicles: vehiclesRes.data.map(
            (v: { id: number; plateNumber: string }) => ({
              value: v.id,
              label: v.plateNumber,
            })
          ),
          routes: routesRes.data.map(
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
  }, [mounted, token, user, filterOptionsLoaded]);

  // Initial load and filter change handler
  useEffect(() => {
    if (!mounted || !token || !user) return;
    refreshOperations();
  }, [
    mounted,
    token,
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
            <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-2">
              <div className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </div>
              <span className="text-sm font-medium text-foreground">
                Sistema Activo
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Active Operations */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Operaciones Activas
                  </p>
                  <p className="text-4xl font-bold text-foreground mb-2">
                    {stats.activeOperations}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-500">
                    <svg
                      className="w-4 h-4"
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
                    <span>Total de {stats.totalOperations} registradas</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-500/20 rounded-xl">
                  <svg
                    className="w-8 h-8 text-blue-500"
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

          {/* In Transit */}
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    En Tránsito
                  </p>
                  <p className="text-4xl font-bold text-foreground mb-2">
                    {stats.inTransit}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-yellow-500">
                    <svg
                      className="w-4 h-4"
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
                    <span>Operaciones en curso</span>
                  </div>
                </div>
                <div className="p-4 bg-yellow-500/20 rounded-xl">
                  <svg
                    className="w-8 h-8 text-yellow-500"
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
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Pendientes de Cierre
                  </p>
                  <p className="text-4xl font-bold text-foreground mb-2">
                    {stats.pendingClosure}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-purple-500">
                    <svg
                      className="w-4 h-4"
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
                    <span>Por confirmar o iniciar</span>
                  </div>
                </div>
                <div className="p-4 bg-purple-500/20 rounded-xl">
                  <svg
                    className="w-8 h-8 text-purple-500"
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
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Completadas
                  </p>
                  <p className="text-4xl font-bold text-foreground mb-2">
                    {stats.completed}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-500">
                    <svg
                      className="w-4 h-4"
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
                    <span>Operaciones finalizadas</span>
                  </div>
                </div>
                <div className="p-4 bg-green-500/20 rounded-xl">
                  <svg
                    className="w-8 h-8 text-green-500"
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

        {/* Filters Section */}
        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-foreground text-xl flex items-center gap-2">
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
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filtros Avanzados
                {activeFiltersCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </CardTitle>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg border border-border hover:border-primary transition-all duration-200"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por número, origen, destino, cliente, proveedor, vehículo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-ui-surface-elevated border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Estado
                </label>
                <select
                  value={filters.status || ""}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-4 py-3 bg-ui-surface-elevated border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  disabled={loading}
                >
                  <option value="">Todos los estados</option>
                  {filterOptions.statuses.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Filter */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Cliente
                </label>
                <select
                  value={filters.clientId || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "clientId",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full px-4 py-3 bg-ui-surface-elevated border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  disabled={loading}
                >
                  <option value="">Todos los clientes</option>
                  {filterOptions.clients.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Provider Filter */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Proveedor
                </label>
                <select
                  value={filters.providerId || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "providerId",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full px-4 py-3 bg-ui-surface-elevated border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  disabled={loading}
                >
                  <option value="">Todos los proveedores</option>
                  {filterOptions.providers.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Filter (Maquinaria) */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Maquinaria / Vehículo
                </label>
                <select
                  value={filters.vehicleId || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "vehicleId",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full px-4 py-3 bg-ui-surface-elevated border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  disabled={loading}
                >
                  <option value="">Todos los vehículos</option>
                  {filterOptions.vehicles.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operations Table */}
        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-foreground text-xl flex items-center gap-2">
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
              Operaciones
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredOperations.length} resultados)
              </span>
            </CardTitle>
            <button
              onClick={() => refreshOperations()}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-primary hover:text-purple-300 px-4 py-2 rounded-lg border border-primary hover:border-purple-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Actualizar
            </button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredOperations.length === 0 ? (
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
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-4 pr-4">
                        Operación
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-4 pr-4">
                        Cliente
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-4 pr-4">
                        Proveedor
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-4 pr-4">
                        Ruta
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-4 pr-4">
                        Vehículo
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-4 pr-4">
                        Estado
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-4">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredOperations.map((operation) => {
                      const status =
                        statusConfig[operation.operation.status] ||
                        statusConfig.scheduled;

                      return (
                        <tr
                          key={operation.operation.id}
                          className="hover:bg-ui-surface-elevated/50 transition-colors cursor-pointer"
                          onClick={() => handleOperationClick(operation)}
                        >
                          {/* Operation */}
                          <td className="py-4 pr-4">
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
                          </td>

                          {/* Client */}
                          <td className="py-4 pr-4">
                            <span className="text-sm text-foreground">
                              {operation.client?.businessName || "Sin cliente"}
                            </span>
                          </td>

                          {/* Provider */}
                          <td className="py-4 pr-4">
                            <span className="text-sm text-foreground">
                              {operation.provider?.businessName ||
                                "Sin proveedor"}
                            </span>
                          </td>

                          {/* Route */}
                          <td className="py-4 pr-4">
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
                          </td>

                          {/* Vehicle */}
                          <td className="py-4 pr-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {operation.vehicle.plateNumber}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {operation.vehicle.brand}{" "}
                                {operation.vehicle.model}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 pr-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${status.className}`}
                            >
                              <span>{status.icon}</span>
                              {status.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOperationClick(operation);
                                }}
                                className="p-2 hover:bg-ui-surface-elevated rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                title="Ver detalles"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => handleEditClick(operation, e)}
                                className="p-2 hover:bg-ui-surface-elevated rounded-lg text-muted-foreground hover:text-blue-500 transition-colors"
                                title="Editar asignaciones"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
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
