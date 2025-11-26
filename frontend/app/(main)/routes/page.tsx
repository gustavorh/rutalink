"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser } from "@/lib/auth";
import { api } from "@/lib/client-api";
import type { Route } from "@/types/routes";
import type {
  CreateRouteDto,
  UpdateRouteDto,
  RouteQueryDto,
} from "@/lib/api-types";
import { ROUTE_TYPES, DIFFICULTY_LEVELS } from "@/types/routes";
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
  Route as RouteIcon,
  CheckCircle,
  MapPin,
  Navigation,
  FileText,
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
import {
  DataTable,
  DataTableColumn,
  DataTableFilter,
  DataTableAction,
} from "@/components/ui/data-table";
import { toast } from "sonner";
import {
  exportRoutesToXLSX,
  exportRoutesToPDF,
  type RouteExportData,
} from "@/lib/export-utils";
import type { ExportFormat } from "@/components/ui/export-dropdown";

export default function RoutesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState<Route | null>(null);
  const [formData, setFormData] = useState<CreateRouteDto | UpdateRouteDto>({
    name: "",
    code: "",
    origin: "",
    destination: "",
    distance: undefined,
    estimatedDuration: undefined,
    routeType: undefined,
    difficulty: undefined,
    roadConditions: "",
    tollsRequired: false,
    estimatedTollCost: undefined,
    observations: "",
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
      routeType: "all",
      difficulty: "all",
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
    fetchRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    search,
    filterState.status,
    filterState.routeType,
    filterState.difficulty,
  ]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const params: RouteQueryDto = {
        page,
        limit: pagination.limit,
      };

      if (search) params.search = search;
      if (filterState.status !== "all")
        params.status = filterState.status === "active" ? true : false;
      if (filterState.routeType !== "all")
        params.routeType = filterState.routeType as RouteQueryDto["routeType"];
      if (filterState.difficulty !== "all")
        params.difficulty =
          filterState.difficulty as RouteQueryDto["difficulty"];

      const response = await api.routes.list(params);
      setRoutes(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar rutas");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchRoutes();
  };

  const handleDeleteClick = (route: Route) => {
    setRouteToDelete(route);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!routeToDelete) return;

    try {
      await api.routes.delete(routeToDelete.id);
      setDeleteDialogOpen(false);
      setRouteToDelete(null);
      fetchRoutes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar ruta");
    }
  };

  const handleCreateClick = () => {
    setFormData({
      name: "",
      code: "",
      origin: "",
      destination: "",
      distance: undefined,
      estimatedDuration: undefined,
      routeType: undefined,
      difficulty: undefined,
      roadConditions: "",
      tollsRequired: false,
      estimatedTollCost: undefined,
      observations: "",
      notes: "",
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (route: Route) => {
    setRouteToEdit(route);
    setFormData({
      name: route.name,
      code: route.code || "",
      origin: route.origin,
      destination: route.destination,
      distance: route.distance || undefined,
      estimatedDuration: route.estimatedDuration || undefined,
      routeType: (route.routeType || undefined) as
        | (typeof ROUTE_TYPES)[number]["value"]
        | undefined,
      difficulty: (route.difficulty || undefined) as
        | (typeof DIFFICULTY_LEVELS)[number]["value"]
        | undefined,
      roadConditions: route.roadConditions || "",
      tollsRequired: route.tollsRequired || false,
      estimatedTollCost: route.estimatedTollCost || undefined,
      observations: route.observations || "",
      notes: route.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setError(null);

      if (editDialogOpen && routeToEdit) {
        // Update existing route
        await api.routes.update(routeToEdit.id, formData as UpdateRouteDto);
        setEditDialogOpen(false);
        setRouteToEdit(null);
      } else {
        // Create new route
        await api.routes.create(formData as CreateRouteDto);
        setCreateDialogOpen(false);
      }

      fetchRoutes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar ruta");
    } finally {
      setFormLoading(false);
    }
  };

  const getRouteTypeLabel = (routeType?: string | null) => {
    if (!routeType) return "N/A";
    const found = ROUTE_TYPES.find((t) => t.value === routeType);
    return found ? found.label : routeType;
  };

  const getDifficultyLabel = (difficulty?: string | null) => {
    if (!difficulty) return "N/A";
    const found = DIFFICULTY_LEVELS.find((d) => d.value === difficulty);
    return found ? found.label : difficulty;
  };

  const getDifficultyColor = (difficulty?: string | null) => {
    if (!difficulty) return "text-muted-foreground";
    switch (difficulty) {
      case "fácil":
        return "text-success";
      case "moderada":
        return "text-warning";
      case "difícil":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
    }
    return `${mins}m`;
  };

  // Handle export
  const handleExport = async (format: ExportFormat) => {
    if (routes.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    setExportLoading(true);

    try {
      // Transform routes to export format
      const exportData: RouteExportData[] = routes.map((route) => ({
        id: route.id,
        name: route.name,
        code: route.code,
        origin: route.origin,
        destination: route.destination,
        distance: route.distance,
        estimatedDuration: route.estimatedDuration,
        routeType: route.routeType,
        difficulty: route.difficulty,
        roadConditions: route.roadConditions,
        tollsRequired: route.tollsRequired,
        estimatedTollCost: route.estimatedTollCost,
        status: route.status,
      }));

      if (format === "xlsx") {
        exportRoutesToXLSX(exportData, "rutas");
        toast.success("Archivo Excel exportado correctamente");
      } else if (format === "pdf") {
        exportRoutesToPDF(exportData, "rutas");
        toast.success("Archivo PDF exportado correctamente");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Error al exportar los datos");
    } finally {
      setExportLoading(false);
    }
  };

  // Table Columns Configuration
  const tableColumns: DataTableColumn<Route>[] = [
    {
      key: "name",
      header: "Nombre del Tramo",
      accessor: (route) => (
        <div>
          <div className="font-medium text-foreground">{route.name}</div>
          {route.code && (
            <div className="text-xs text-muted-foreground mt-1">
              Código: {route.code}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "route",
      header: "Ruta",
      accessor: (route) => (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-1 text-foreground">
            <MapPin className="w-3 h-3 text-success" />
            <span className="font-medium">{route.origin}</span>
          </div>
          <div className="flex items-center gap-1 text-foreground">
            <Navigation className="w-3 h-3 text-destructive" />
            <span className="font-medium">{route.destination}</span>
          </div>
        </div>
      ),
    },
    {
      key: "details",
      header: "Detalles",
      accessor: (route) => (
        <div className="text-sm space-y-1">
          {route.distance && (
            <div className="text-foreground">
              <span className="font-medium">{route.distance} km</span>
            </div>
          )}
          {route.estimatedDuration && (
            <div className="text-muted-foreground text-xs">
              {formatDuration(route.estimatedDuration)}
            </div>
          )}
          {!route.distance && !route.estimatedDuration && (
            <span className="text-muted-foreground text-xs">N/A</span>
          )}
        </div>
      ),
    },
    {
      key: "routeType",
      header: "Tipo",
      accessor: (route) =>
        route.routeType ? (
          <Badge variant="outline" className="border-primary/50 text-primary">
            {getRouteTypeLabel(route.routeType)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">N/A</span>
        ),
    },
    {
      key: "difficulty",
      header: "Dificultad",
      accessor: (route) =>
        route.difficulty ? (
          <span
            className={`font-medium ${getDifficultyColor(route.difficulty)}`}
          >
            {getDifficultyLabel(route.difficulty)}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">N/A</span>
        ),
    },
    {
      key: "tolls",
      header: "Peajes",
      accessor: (route) =>
        route.tollsRequired ? (
          <div className="text-sm">
            <div className="text-warning font-medium">Sí</div>
            {route.estimatedTollCost && (
              <div className="text-muted-foreground text-xs">
                ${route.estimatedTollCost.toLocaleString("es-CL")}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">No</span>
        ),
    },
    {
      key: "status",
      header: "Estado",
      accessor: (route) => (
        <Badge
          variant={route.status ? "default" : "outline"}
          className={
            route.status
              ? "bg-success/10 text-success border-success/50"
              : "border-slate-500/50 text-muted-foreground"
          }
        >
          {route.status ? "Activa" : "Inactiva"}
        </Badge>
      ),
    },
  ];

  // Table Filters Configuration
  const tableFilters: DataTableFilter[] = [
    {
      id: "status",
      label: "Estado",
      type: "select",
      value: filterState.status,
      onChange: (value) => setFilter("status", value),
      placeholder: "Estado",
      options: [
        { value: "all", label: "Todos los estados" },
        { value: "active", label: "Activa" },
        { value: "inactive", label: "Inactiva" },
      ],
    },
    {
      id: "routeType",
      label: "Tipo de Ruta",
      type: "select",
      value: filterState.routeType,
      onChange: (value) => setFilter("routeType", value),
      placeholder: "Tipo de ruta",
      options: [
        { value: "all", label: "Todos los tipos" },
        ...ROUTE_TYPES.map((type) => ({
          value: type.value,
          label: type.label,
        })),
      ],
    },
    {
      id: "difficulty",
      label: "Dificultad",
      type: "select",
      value: filterState.difficulty,
      onChange: (value) => setFilter("difficulty", value),
      placeholder: "Dificultad",
      options: [
        { value: "all", label: "Todas las dificultades" },
        ...DIFFICULTY_LEVELS.map((level) => ({
          value: level.value,
          label: level.label,
        })),
      ],
    },
  ];

  // Table Actions Configuration
  const tableActions: DataTableAction<Route>[] = [
    {
      label: "Editar",
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditClick,
      variant: "ghost",
      className: "text-primary hover:text-primary-dark",
    },
    {
      label: "Eliminar",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteClick,
      variant: "ghost",
      className: "text-destructive hover:text-red-700",
    },
  ];

  // Row click handler
  const handleRowClick = (route: Route) => {
    router.push(`/routes/${route.id}`);
  };

  if (!mounted) {
    return <LoadingState />;
  }

  const user = getUser();
  if (!user) {
    return null;
  }

  // Calculate statistics
  const activeRoutes = routes.filter((r) => r.status).length;
  const routesByType = routes.reduce((acc, route) => {
    const type = route.routeType || "Sin clasificar";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topType = Object.entries(routesByType).sort((a, b) => b[1] - a[1])[0];
  const avgDistance =
    routes.filter((r) => r.distance).length > 0
      ? Math.round(
          routes.reduce((sum, r) => sum + (r.distance || 0), 0) /
            routes.filter((r) => r.distance).length
        )
      : 0;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Mantenedor de Tramos y Rutas"
          description="Gestión de rutas estándar para optimización operativa"
          icon={<RouteIcon className="w-6 h-6" />}
          actionLabel={
            <>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Ruta
            </>
          }
          onAction={handleCreateClick}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatisticsCard
            value={total}
            label="Total Rutas"
            icon={<RouteIcon className="w-6 h-6" />}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
          />
          <StatisticsCard
            value={activeRoutes}
            label="Rutas Activas"
            icon={<CheckCircle className="w-6 h-6" />}
            iconBgColor="bg-success/10"
            iconColor="text-success"
          />
          <StatisticsCard
            value={avgDistance > 0 ? `${avgDistance} km` : "N/A"}
            label="Distancia Promedio"
            icon={<Navigation className="w-6 h-6" />}
            iconBgColor="bg-secondary/10"
            iconColor="text-secondary"
          />
          <StatisticsCard
            value={
              topType
                ? `${getRouteTypeLabel(topType[0])} (${topType[1]})`
                : "N/A"
            }
            label="Tipo Principal"
            icon={<MapPin className="w-6 h-6" />}
            iconBgColor="bg-orange-500/10"
            iconColor="text-orange-400"
          />
        </div>

        {/* Data Table */}
        <DataTable
          data={routes}
          columns={tableColumns}
          pagination={pagination}
          onPageChange={setPage}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nombre, código, origen o destino..."
          onSearchSubmit={handleSearch}
          filters={tableFilters}
          showFilters={showFilters}
          onToggleFilters={toggleFilters}
          onClearFilters={() => {
            setSearch("");
            clearAllFilters();
            setPage(1);
          }}
          actions={tableActions}
          onRowClick={handleRowClick}
          loading={loading}
          error={error}
          emptyState={
            <EmptyState
              icon={<RouteIcon className="w-12 h-12 text-slate-600" />}
              title="No se encontraron rutas"
              actionLabel={
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primera Ruta
                </>
              }
              onAction={handleCreateClick}
            />
          }
          title="Listado de Rutas"
          icon={<FileText className="w-5 h-5 text-primary" />}
          description={`Total de ${total} rutas registradas`}
          lastUpdate={lastUpdate}
          onRefresh={fetchRoutes}
          onExport={handleExport}
          exportLoading={exportLoading}
          getRowKey={(route) => route.id}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={routeToDelete?.name}
        itemType="ruta"
        description={`¿Estás seguro de que deseas eliminar la ruta ${routeToDelete?.name}? Esta acción no se puede deshacer y no podrá realizarse si la ruta está siendo usada en operaciones.`}
      />

      {/* Create/Edit Route Dialog */}
      <FormDialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setRouteToEdit(null);
          }
        }}
        title={editDialogOpen ? "Editar Ruta" : "Nueva Ruta"}
        description={
          editDialogOpen
            ? "Actualiza la información de la ruta"
            : "Completa la información de la nueva ruta"
        }
        onSubmit={handleFormSubmit}
        loading={formLoading}
        submitLabel={editDialogOpen ? "Actualizar Ruta" : "Crear Ruta"}
        maxWidth="4xl"
        onCancel={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setRouteToEdit(null);
        }}
      >
        <FormSection title="Información Básica">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name" className="text-foreground">
                Nombre del Tramo *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: Santiago - Valparaíso"
              />
            </div>

            <div>
              <Label htmlFor="code" className="text-foreground">
                Código Interno
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: STG-VAL-001"
              />
            </div>

            <div>
              <Label htmlFor="routeType" className="text-foreground">
                Tipo de Ruta
              </Label>
              <Select
                value={formData.routeType || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    routeType: value as (typeof ROUTE_TYPES)[number]["value"],
                  })
                }
              >
                <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ROUTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FormSection>

        <FormSection title="Detalles de la Ruta">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="origin" className="text-foreground">
                Origen *
              </Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) =>
                  setFormData({ ...formData, origin: e.target.value })
                }
                required
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: Santiago, Región Metropolitana"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="destination" className="text-foreground">
                Destino *
              </Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) =>
                  setFormData({ ...formData, destination: e.target.value })
                }
                required
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: Valparaíso, Región de Valparaíso"
              />
            </div>

            <div>
              <Label htmlFor="distance" className="text-foreground">
                Distancia (km)
              </Label>
              <Input
                id="distance"
                type="number"
                min="0"
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
                placeholder="Ej: 120"
              />
            </div>

            <div>
              <Label htmlFor="estimatedDuration" className="text-foreground">
                Duración Estimada (min)
              </Label>
              <Input
                id="estimatedDuration"
                type="number"
                min="0"
                value={formData.estimatedDuration || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedDuration: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: 90"
              />
            </div>

            <div>
              <Label htmlFor="difficulty" className="text-foreground">
                Dificultad
              </Label>
              <Select
                value={formData.difficulty || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    difficulty:
                      value as (typeof DIFFICULTY_LEVELS)[number]["value"],
                  })
                }
              >
                <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                  <SelectValue placeholder="Seleccionar dificultad" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="roadConditions" className="text-foreground">
                Condiciones del Camino
              </Label>
              <Input
                id="roadConditions"
                value={formData.roadConditions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    roadConditions: e.target.value,
                  })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Ej: Pavimentado, buen estado"
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Información de Peajes">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="tollsRequired"
                checked={formData.tollsRequired}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tollsRequired: e.target.checked,
                  })
                }
                className="rounded border-border bg-ui-surface-elevated text-primary focus:ring-blue-500"
              />
              <Label
                htmlFor="tollsRequired"
                className="text-foreground cursor-pointer"
              >
                Requiere Peajes
              </Label>
            </div>

            {formData.tollsRequired && (
              <div>
                <Label htmlFor="estimatedTollCost" className="text-foreground">
                  Costo Estimado de Peajes ($)
                </Label>
                <Input
                  id="estimatedTollCost"
                  type="number"
                  min="0"
                  value={formData.estimatedTollCost || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedTollCost: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  className="bg-ui-surface-elevated border-border text-foreground mt-1"
                  placeholder="Ej: 5000"
                />
              </div>
            )}
          </div>
        </FormSection>

        <FormSection title="Información Adicional">
          <div className="space-y-4">
            <div>
              <Label htmlFor="observations" className="text-foreground">
                Observaciones
              </Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) =>
                  setFormData({ ...formData, observations: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Observaciones generales de la ruta..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-foreground">
                Notas Internas
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
                placeholder="Notas internas sobre la ruta..."
                rows={3}
              />
            </div>
          </div>
        </FormSection>
      </FormDialog>
    </main>
  );
}
