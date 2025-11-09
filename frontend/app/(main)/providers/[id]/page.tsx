"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, isAuthenticated } from "@/lib/auth";
import {
  getProviderById,
  getProviderStatistics,
  getProviderOperations,
} from "@/lib/api";
import type {
  Provider,
  ProviderStatistics,
  ProviderOperation,
} from "@/types/providers";
import { BUSINESS_TYPES } from "@/types/providers";
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
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Building2,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Info,
  Star,
  Truck,
} from "lucide-react";

const OPERATION_STATUSES = [
  { value: "scheduled", label: "Programada", color: "blue" },
  { value: "in-progress", label: "En Progreso", color: "yellow" },
  { value: "completed", label: "Completada", color: "green" },
  { value: "cancelled", label: "Cancelada", color: "red" },
];

export default function ProviderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const providerId = Number(params.id);

  const [mounted, setMounted] = useState(false);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [statistics, setStatistics] = useState<ProviderStatistics | null>(null);
  const [operations, setOperations] = useState<ProviderOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "info" | "statistics" | "operations"
  >("info");

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
    fetchProviderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, page]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const [providerData, statsData, opsData] = await Promise.all([
        getProviderById(token, providerId),
        getProviderStatistics(token, providerId),
        getProviderOperations(token, providerId, page, limit),
      ]);

      setProvider(providerData);
      setStatistics(statsData);
      setOperations(opsData.data);
      setTotalPages(opsData.pagination.totalPages);
      setTotal(opsData.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar datos del proveedor"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("es-CL");
  };

  const getBusinessTypeLabel = (type?: string | null) => {
    if (!type) return "N/A";
    const found = BUSINESS_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  const getOperationStatusBadge = (status: string) => {
    const statusConfig = OPERATION_STATUSES.find((s) => s.value === status);
    if (!statusConfig) return <Badge>{status}</Badge>;

    const variantMap: Record<
      string,
      "default" | "warning" | "success" | "destructive"
    > = {
      blue: "default",
      yellow: "warning",
      green: "success",
      red: "destructive",
    };

    return (
      <Badge variant={variantMap[statusConfig.color] || "default"}>
        {statusConfig.label}
      </Badge>
    );
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
              Cargando información del proveedor...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !provider) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">
              {error || "Proveedor no encontrado"}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/providers")}
              className="border-border text-foreground hover:bg-card"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-6 h-6 text-secondary" />
                {provider.businessName}
              </h1>
              <p className="text-muted-foreground mt-1">
                RUT: {provider.taxId || "N/A"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/providers/${providerId}/edit`)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2">
          <Badge
            variant={provider.status ? "default" : "outline"}
            className={
              provider.status
                ? "bg-success/10 text-success border-success/50"
                : "border-slate-500/50 text-muted-foreground"
            }
          >
            {provider.status ? "Activo" : "Inactivo"}
          </Badge>
          {provider.businessType && (
            <Badge variant="outline" className="border-primary/50 text-primary">
              {getBusinessTypeLabel(provider.businessType)}
            </Badge>
          )}
          {provider.rating && (
            <Badge
              variant="outline"
              className="border-yellow-500/50 text-yellow-400"
            >
              <Star className="w-3 h-3 mr-1 fill-current" />
              {provider.rating}/5
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
          <Button
            variant={activeTab === "operations" ? "default" : "ghost"}
            onClick={() => setActiveTab("operations")}
            className={
              activeTab === "operations"
                ? "bg-purple-600 hover:bg-purple-700"
                : "text-foreground hover:bg-card"
            }
          >
            <Package className="mr-2 h-4 w-4" />
            Operaciones ({total})
          </Button>
        </div>

        {/* Tab Content: Information */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Razón Social
                  </p>
                  <p className="text-lg text-foreground">
                    {provider.businessName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    RUT
                  </p>
                  <p className="text-lg text-foreground">
                    {provider.taxId || "N/A"}
                  </p>
                </div>
                {provider.contactName && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Persona de Contacto
                    </p>
                    <p className="text-lg text-foreground">
                      {provider.contactName}
                    </p>
                  </div>
                )}
                {provider.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`mailto:${provider.contactEmail}`}
                      className="text-primary hover:text-blue-300"
                    >
                      {provider.contactEmail}
                    </a>
                  </div>
                )}
                {provider.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`tel:${provider.contactPhone}`}
                      className="text-primary hover:text-blue-300"
                    >
                      {provider.contactPhone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Información de Servicio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {provider.businessType && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tipo de Negocio
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1 border-secondary/50 text-secondary"
                    >
                      {getBusinessTypeLabel(provider.businessType)}
                    </Badge>
                  </div>
                )}
                {provider.serviceTypes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tipos de Servicio
                    </p>
                    <p className="text-lg text-foreground">
                      {provider.serviceTypes}
                    </p>
                  </div>
                )}
                {provider.fleetSize && (
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Tamaño de Flota
                      </p>
                      <p className="text-lg text-foreground">
                        {provider.fleetSize} vehículos
                      </p>
                    </div>
                  </div>
                )}
                {provider.rating && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Calificación
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg text-foreground">
                        {provider.rating}/5
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-success" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {provider.address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Dirección
                    </p>
                    <p className="text-lg text-foreground">
                      {provider.address}
                    </p>
                  </div>
                )}
                {provider.city && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Ciudad
                    </p>
                    <p className="text-lg text-foreground">{provider.city}</p>
                  </div>
                )}
                {provider.region && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Región
                    </p>
                    <p className="text-lg text-foreground">{provider.region}</p>
                  </div>
                )}
                {provider.country && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      País
                    </p>
                    <p className="text-lg text-foreground">
                      {provider.country}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {(provider.observations || provider.notes) && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Información Adicional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {provider.observations && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Observaciones
                      </p>
                      <p className="text-sm text-foreground">
                        {provider.observations}
                      </p>
                    </div>
                  )}
                  {provider.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Notas Internas
                      </p>
                      <p className="text-sm text-foreground">
                        {provider.notes}
                      </p>
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
                <p className="text-4xl font-bold text-foreground">
                  {statistics.totalOperations}
                </p>
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
                    {statistics.completedOperations}
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
                    {statistics.inProgressOperations}
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
                    {statistics.scheduledOperations}
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
                    {statistics.cancelledOperations}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Content: Operations */}
        {activeTab === "operations" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                Historial de Operaciones
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {total > 0
                  ? `Total de ${total} operaciones registradas`
                  : "No hay operaciones registradas"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {operations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay operaciones para este proveedor
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">
                          N° Operación
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Tipo
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Cliente
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Origen → Destino
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Fecha Programada
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Estado
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operations.map((op) => (
                        <TableRow
                          key={op.operation.id}
                          className="border-b border-border hover:bg-ui-surface-elevated cursor-pointer"
                          onClick={() =>
                            router.push(`/operations/${op.operation.id}`)
                          }
                        >
                          <TableCell className="font-mono text-sm text-foreground">
                            OP-{op.operation.id.toString().padStart(6, "0")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-secondary/50 text-secondary"
                            >
                              {op.operation.operationType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-foreground">
                            {op.client?.businessName || "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="text-foreground">
                                {op.operation.origin}
                              </div>
                              <div className="text-muted-foreground text-xs mt-1">
                                → {op.operation.destination}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground text-sm">
                            {formatDateTime(op.operation.scheduledStartDate)}
                          </TableCell>
                          <TableCell>
                            {getOperationStatusBadge(op.operation.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
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
                          className="border-border text-foreground hover:bg-ui-surface-elevated"
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setPage(page + 1)}
                          disabled={page === totalPages}
                          className="border-border text-foreground hover:bg-ui-surface-elevated"
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
