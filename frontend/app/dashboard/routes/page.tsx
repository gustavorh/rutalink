"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import { getRoutes, deleteRoute, createRoute, updateRoute } from "@/lib/api";
import type {
  Route,
  RouteQueryParams,
  CreateRouteInput,
  UpdateRouteInput,
} from "@/types/routes";
import { ROUTE_TYPES, DIFFICULTY_LEVELS } from "@/types/routes";
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
  Route as RouteIcon,
  AlertTriangle,
  CheckCircle,
  Filter,
  Download,
  MapPin,
  Clock,
  Navigation,
  FileText,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [formData, setFormData] = useState<CreateRouteInput | UpdateRouteInput>(
    {
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
    }
  );
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [routeTypeFilter, setRouteTypeFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
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
    fetchRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, routeTypeFilter, difficultyFilter]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const user = getUser();
      if (!token || !user) {
        router.push("/login");
        return;
      }

      const params: RouteQueryParams = {
        page,
        limit,
      };

      if (search) params.search = search;
      if (statusFilter !== "all")
        params.status = statusFilter === "active" ? true : false;
      if (routeTypeFilter !== "all") params.routeType = routeTypeFilter;
      if (difficultyFilter !== "all") params.difficulty = difficultyFilter;

      const response = await getRoutes(token, params);
      setRoutes(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
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
      const token = getToken();
      if (!token) return;

      await deleteRoute(token, routeToDelete.id);
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
    const token = getToken();
    if (!token) return;

    try {
      setFormLoading(true);
      setError(null);

      if (editDialogOpen && routeToEdit) {
        // Update existing route
        await updateRoute(token, routeToEdit.id, formData as UpdateRouteInput);
        setEditDialogOpen(false);
        setRouteToEdit(null);
      } else {
        // Create new route
        await createRoute(token, formData as CreateRouteInput);
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
        {/* Page Header with Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <RouteIcon className="w-6 h-6 text-primary" />
              Mantenedor de Tramos y Rutas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión de rutas estándar para optimización operativa
            </p>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-primary hover:bg-primary-dark text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Ruta
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Rutas
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <RouteIcon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Rutas Activas
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {activeRoutes}
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
                    Distancia Promedio
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {avgDistance > 0 ? `${avgDistance} km` : "N/A"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Tipo Principal
                  </p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {topType ? getRouteTypeLabel(topType[0]) : "N/A"}
                  </p>
                  {topType && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {topType[1]} ruta{topType[1] !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-orange-400" />
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
                Filtra y busca rutas según tus criterios
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
                    placeholder="Buscar por nombre, código, origen o destino..."
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
                        <SelectItem value="active">Activa</SelectItem>
                        <SelectItem value="inactive">Inactiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Tipo de Ruta
                    </label>
                    <Select
                      value={routeTypeFilter}
                      onValueChange={setRouteTypeFilter}
                    >
                      <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground">
                        <SelectValue placeholder="Tipo de ruta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {ROUTE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Dificultad
                    </label>
                    <Select
                      value={difficultyFilter}
                      onValueChange={setDifficultyFilter}
                    >
                      <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground">
                        <SelectValue placeholder="Dificultad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          Todas las dificultades
                        </SelectItem>
                        {DIFFICULTY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
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

        {/* Routes Table */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Listado de Rutas
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Total de {total} rutas registradas
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
                <p className="text-muted-foreground mt-4">Cargando rutas...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">{error}</p>
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-12">
                <RouteIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron rutas</p>
                <Button
                  onClick={handleCreateClick}
                  className="mt-4 bg-primary hover:bg-primary-dark"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primera Ruta
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">
                          Nombre / Código
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Origen → Destino
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Distancia
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Duración
                        </TableHead>
                        <TableHead className="text-muted-foreground">Tipo</TableHead>
                        <TableHead className="text-muted-foreground">
                          Dificultad
                        </TableHead>
                        <TableHead className="text-muted-foreground">Peajes</TableHead>
                        <TableHead className="text-muted-foreground">Estado</TableHead>
                        <TableHead className="text-right text-muted-foreground">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {routes.map((route) => (
                        <TableRow
                          key={route.id}
                          className="border-b border-border hover:bg-ui-surface-elevated"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-foreground">
                                {route.name}
                              </div>
                              {route.code && (
                                <div className="text-xs text-muted-foreground mt-1 font-mono">
                                  {route.code}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-1 text-foreground">
                                <MapPin className="w-3 h-3 text-success" />
                                <span className="truncate max-w-[150px]">
                                  {route.origin}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-3 h-3 text-destructive" />
                                <span className="truncate max-w-[150px]">
                                  {route.destination}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {route.distance ? (
                              <div className="flex items-center gap-1 text-foreground">
                                <Navigation className="w-3 h-3 text-primary" />
                                <span className="font-medium">
                                  {route.distance} km
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {route.estimatedDuration ? (
                              <div className="flex items-center gap-1 text-foreground">
                                <Clock className="w-3 h-3 text-secondary" />
                                <span className="font-medium">
                                  {formatDuration(route.estimatedDuration)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {route.routeType ? (
                              <Badge
                                variant="outline"
                                className="border-primary/50 text-primary"
                              >
                                {getRouteTypeLabel(route.routeType)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {route.difficulty ? (
                              <span
                                className={`font-medium ${getDifficultyColor(
                                  route.difficulty
                                )}`}
                              >
                                {getDifficultyLabel(route.difficulty)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {route.tollsRequired ? (
                              <div className="space-y-1">
                                <Badge
                                  variant="outline"
                                  className="border-yellow-500/50 text-warning"
                                >
                                  Sí
                                </Badge>
                                {route.estimatedTollCost && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <DollarSign className="w-3 h-3" />$
                                    {route.estimatedTollCost}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-slate-500/50 text-muted-foreground"
                              >
                                No
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  router.push(`/dashboard/routes/${route.id}`)
                                }
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(route)}
                                className="text-muted-foreground hover:text-secondary hover:bg-secondary/10"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(route)}
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
                    {Math.min(page * limit, total)} de {total} rutas
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
              ¿Estás seguro de que deseas eliminar la ruta{" "}
              <strong className="text-foreground">{routeToDelete?.name}</strong>?
              Esta acción no se puede deshacer y no podrá realizarse si la ruta
              está siendo usada en operaciones.
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

      {/* Create/Edit Route Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setRouteToEdit(null);
          }
        }}
      >
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editDialogOpen ? "Editar Ruta" : "Nueva Ruta"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editDialogOpen
                ? "Actualiza la información de la ruta"
                : "Completa la información de la nueva ruta"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Información Básica
              </h3>

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
                        routeType:
                          value as (typeof ROUTE_TYPES)[number]["value"],
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
            </div>

            {/* Route Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Detalles de la Ruta
              </h3>

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
            </div>

            {/* Toll Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Información de Peajes
              </h3>

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
                    <Label
                      htmlFor="estimatedTollCost"
                      className="text-foreground"
                    >
                      Costo Estimado de Peajes
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
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Información Adicional
              </h3>

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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditDialogOpen(false);
                  setRouteToEdit(null);
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
                ) : editDialogOpen ? (
                  "Actualizar Ruta"
                ) : (
                  "Crear Ruta"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
