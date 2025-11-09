"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, isAuthenticated } from "@/lib/auth";
import { getRouteById, getRouteStatistics } from "@/lib/api";
import type { Route, RouteStatistics } from "@/types/routes";
import { ROUTE_TYPES, DIFFICULTY_LEVELS } from "@/types/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Route as RouteIcon,
  BarChart3,
  Info,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Package,
  Navigation,
  DollarSign,
  AlertCircle,
} from "lucide-react";

export default function RouteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const routeId = Number(params.id);

  const [mounted, setMounted] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);
  const [statistics, setStatistics] = useState<RouteStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "statistics">("info");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchRouteData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  const fetchRouteData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const [routeData, statsData] = await Promise.all([
        getRouteById(token, routeId),
        getRouteStatistics(token, routeId),
      ]);

      setRoute(routeData);
      setStatistics(statsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar datos de la ruta"
      );
    } finally {
      setLoading(false);
    }
  };

  const getRouteTypeLabel = (type?: string | null) => {
    if (!type) return "N/A";
    const found = ROUTE_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  const getDifficultyLabel = (difficulty?: string | null) => {
    if (!difficulty) return "N/A";
    const found = DIFFICULTY_LEVELS.find((d) => d.value === difficulty);
    return found ? found.label : difficulty;
  };

  const getDifficultyColor = (difficulty?: string | null) => {
    if (!difficulty) return "slate";
    switch (difficulty) {
      case "fácil":
        return "success";
      case "moderada":
        return "warning";
      case "difícil":
        return "destructive";
      default:
        return "slate";
    }
  };

  if (!mounted) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-foreground">Cargando...</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-foreground">
              Cargando información de la ruta...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !route) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error || "Ruta no encontrada"}</p>
          </div>
        </div>
      </main>
    );
  }

  const difficultyColor = getDifficultyColor(route.difficulty);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/routes")}
              className="border-border text-foreground hover:bg-card"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <RouteIcon className="w-6 h-6 text-secondary" />
                {route.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {route.code ? `Código: ${route.code}` : "Sin código asignado"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/routes/${routeId}/edit`)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2">
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
          {route.routeType && (
            <Badge variant="outline" className="border-primary/50 text-primary">
              {getRouteTypeLabel(route.routeType)}
            </Badge>
          )}
          {route.difficulty && (
            <Badge
              variant="outline"
              className={`border-${difficultyColor}/50 text-${difficultyColor}`}
            >
              {getDifficultyLabel(route.difficulty)}
            </Badge>
          )}
          {route.tollsRequired && (
            <Badge
              variant="outline"
              className="border-orange-500/50 text-orange-400"
            >
              <DollarSign className="w-3 h-3 mr-1" />
              Requiere Peajes
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <Button
            variant={activeTab === "info" ? "default" : "ghost"}
            onClick={() => setActiveTab("info")}
            className={
              activeTab === "info"
                ? "bg-purple-600 hover:bg-purple-700"
                : "text-foreground hover:bg-card"
            }
          >
            <Info className="mr-2 h-4 w-4" />
            Información
          </Button>
          <Button
            variant={activeTab === "statistics" ? "default" : "ghost"}
            onClick={() => setActiveTab("statistics")}
            className={
              activeTab === "statistics"
                ? "bg-purple-600 hover:bg-purple-700"
                : "text-foreground hover:bg-card"
            }
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Estadísticas
          </Button>
        </div>

        {/* Tab Content: Information */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-secondary" />
                  Información de la Ruta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Nombre
                  </p>
                  <p className="text-lg text-foreground">{route.name}</p>
                </div>
                {route.code && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Código
                    </p>
                    <p className="text-lg font-mono text-foreground">
                      {route.code}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Origen
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Navigation className="w-4 h-4 text-primary" />
                    <p className="text-lg text-foreground">{route.origin}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Destino
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-destructive" />
                    <p className="text-lg text-foreground">
                      {route.destination}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Detalles Técnicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {route.distance && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Distancia
                    </p>
                    <p className="text-lg text-foreground">
                      {route.distance} km
                    </p>
                  </div>
                )}
                {route.estimatedDuration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Duración Estimada
                      </p>
                      <p className="text-lg text-foreground">
                        {Math.floor(route.estimatedDuration / 60)}h{" "}
                        {route.estimatedDuration % 60}min
                      </p>
                    </div>
                  </div>
                )}
                {route.routeType && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tipo de Ruta
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1 border-secondary/50 text-secondary"
                    >
                      {getRouteTypeLabel(route.routeType)}
                    </Badge>
                  </div>
                )}
                {route.difficulty && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Dificultad
                    </p>
                    <Badge
                      variant="outline"
                      className={`mt-1 border-${difficultyColor}/50 text-${difficultyColor}`}
                    >
                      {getDifficultyLabel(route.difficulty)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {(route.roadConditions ||
              route.tollsRequired ||
              route.estimatedTollCost) && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-warning" />
                    Condiciones y Costos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {route.roadConditions && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Condiciones del Camino
                      </p>
                      <p className="text-sm text-foreground">
                        {route.roadConditions}
                      </p>
                    </div>
                  )}
                  {route.tollsRequired && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Peajes
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-orange-500/50 text-orange-400"
                        >
                          Requeridos
                        </Badge>
                        {route.estimatedTollCost && (
                          <span className="text-lg text-foreground">
                            ${route.estimatedTollCost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {(route.observations || route.notes) && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Información Adicional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {route.observations && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Observaciones
                      </p>
                      <p className="text-sm text-foreground">
                        {route.observations}
                      </p>
                    </div>
                  )}
                  {route.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Notas Internas
                      </p>
                      <p className="text-sm text-foreground">{route.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tab Content: Statistics */}
        {activeTab === "statistics" && statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Total de Operaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-primary" />
                  <p className="text-4xl font-bold text-foreground">
                    {statistics.statistics.totalOperations}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Operaciones Completadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-success" />
                  <p className="text-4xl font-bold text-success">
                    {statistics.statistics.completedOperations}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Operaciones en Progreso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-warning" />
                  <p className="text-4xl font-bold text-warning">
                    {statistics.statistics.inProgressOperations}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Operaciones Programadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-primary" />
                  <p className="text-4xl font-bold text-primary">
                    {statistics.statistics.scheduledOperations}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Operaciones Canceladas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                  <p className="text-4xl font-bold text-destructive">
                    {statistics.statistics.cancelledOperations}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
