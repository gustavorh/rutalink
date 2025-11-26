"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/client-api";
import type { Truck, TruckDocument, TruckOperation } from "@/types/trucks";
import {
  VEHICLE_TYPES,
  OPERATIONAL_STATUS,
  DOCUMENT_TYPES,
} from "@/types/trucks";
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
  FileText,
  TruckIcon,
  Calendar,
  Package,
  Clock,
  MapPin,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function TruckDetailPage() {
  const router = useRouter();
  const params = useParams();
  const truckId = params?.id ? parseInt(params.id as string) : null;

  const [mounted, setMounted] = useState(false);
  const [truck, setTruck] = useState<Truck | null>(null);
  const [documents, setDocuments] = useState<TruckDocument[]>([]);
  const [operationHistory, setOperationHistory] = useState<TruckOperation[]>(
    []
  );
  const [upcomingOperations, setUpcomingOperations] = useState<
    TruckOperation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "info" | "documents" | "operations"
  >("info");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    if (truckId) {
      fetchTruckData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [truckId]);

  const fetchTruckData = async () => {
    if (!truckId) return;

    try {
      setLoading(true);
      setError(null);
      const [truckData, docsData, historyData, upcomingData] =
        await Promise.all([
          api.vehicles.get(truckId),
          // Note: These endpoints may need to be added to client-api if they exist
          // For now, using placeholder - adjust based on actual API structure
          Promise.resolve([] as TruckDocument[]), // getTruckDocuments
          Promise.resolve([] as TruckOperation[]), // getTruckOperationHistory
          Promise.resolve([] as TruckOperation[]), // getTruckUpcomingOperations
        ]);

      setTruck(truckData);
      setDocuments(docsData);
      setOperationHistory(historyData);
      setUpcomingOperations(upcomingData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar datos del camión"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CL");
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("es-CL");
  };

  const isExpired = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const getVehicleTypeLabel = (type: string) => {
    return VEHICLE_TYPES.find((vt) => vt.value === type)?.label || type;
  };

  const getOperationalStatusInfo = (status?: string) => {
    if (!status) return OPERATIONAL_STATUS[0];
    return (
      OPERATIONAL_STATUS.find((s) => s.value === status) ||
      OPERATIONAL_STATUS[0]
    );
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find((dt) => dt.value === type)?.label || type;
  };

  // Show loading state
  if (!mounted || loading) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-foreground mt-4">
              Cargando información del camión...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Show error state
  if (error || !truck) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">
              {error || "Camión no encontrado"}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const opStatus = getOperationalStatusInfo(truck.operationalStatus);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/trucks")}
              className="border-border text-foreground hover:bg-card"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TruckIcon className="w-6 h-6 text-secondary" />
                {truck.plateNumber}
              </h1>
              <p className="text-muted-foreground mt-1">
                {truck.brand} {truck.model} ({truck.year})
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/trucks/${truck.id}/edit`)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2">
          <Badge
            variant={truck.status ? "default" : "outline"}
            className={
              truck.status
                ? "bg-success/10 text-success border-success/50"
                : "border-slate-500/50 text-muted-foreground"
            }
          >
            {truck.status ? "Activo" : "Inactivo"}
          </Badge>
          <Badge
            variant="outline"
            className={`border-${opStatus.color}-500/50 text-${opStatus.color}-400`}
          >
            {opStatus.label}
          </Badge>
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
            variant={activeTab === "documents" ? "default" : "ghost"}
            onClick={() => setActiveTab("documents")}
            className={
              activeTab === "documents"
                ? "bg-purple-600 hover:bg-purple-700"
                : "text-foreground hover:bg-card"
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            Documentos ({documents.length})
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
            Operaciones
          </Button>
        </div>

        {/* Tab Content: Information */}
        {activeTab === "info" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Patente
                  </p>
                  <p className="text-lg font-bold text-foreground mt-1">
                    {truck.plateNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Marca
                  </p>
                  <p className="text-lg text-foreground mt-1">
                    {truck.brand || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Modelo
                  </p>
                  <p className="text-lg text-foreground mt-1">
                    {truck.model || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Año
                  </p>
                  <p className="text-lg text-foreground mt-1">
                    {truck.year || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Tipo de Vehículo
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-1 border-primary/50 text-primary"
                  >
                    {getVehicleTypeLabel(truck.vehicleType)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Capacidad
                  </p>
                  <p className="text-lg text-foreground mt-1">
                    {truck.capacity
                      ? `${truck.capacity} ${truck.capacityUnit || ""}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    VIN
                  </p>
                  <p className="text-sm font-mono text-foreground mt-1">
                    {truck.vin || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Color
                  </p>
                  <p className="text-lg text-foreground mt-1">
                    {truck.color || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Estado Operativo
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-1 border-${opStatus.color}-500/50 text-${opStatus.color}-400`}
                  >
                    {opStatus.label}
                  </Badge>
                </div>
              </div>
              {truck.notes && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground">
                    Notas
                  </p>
                  <p className="text-sm text-foreground mt-2">{truck.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab Content: Documents */}
        {activeTab === "documents" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Documentos</CardTitle>
              <CardDescription className="text-muted-foreground">
                Documentación vigente del vehículo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay documentos registrados
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Tipo
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Nombre
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Fecha de Emisión
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Fecha de Vencimiento
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Estado
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow
                        key={doc.id}
                        className="border-b border-border hover:bg-ui-surface-elevated"
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-primary/50 text-primary"
                          >
                            {getDocumentTypeLabel(doc.documentType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {doc.documentName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(doc.issueDate)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(doc.expirationDate)}
                        </TableCell>
                        <TableCell>
                          {doc.expirationDate &&
                          isExpired(doc.expirationDate) ? (
                            <Badge
                              variant="outline"
                              className="border-destructive/50 text-destructive"
                            >
                              Vencido
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-success/50 text-success"
                            >
                              Vigente
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab Content: Operations */}
        {activeTab === "operations" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Operations */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-secondary" />
                  Operaciones Próximas
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {upcomingOperations.length} operaciones programadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingOperations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay operaciones próximas
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingOperations.map((op) => (
                      <div
                        key={op.id}
                        className="p-4 bg-ui-surface-elevated rounded-lg border border-border hover:bg-card cursor-pointer transition-colors"
                        onClick={() => router.push(`/operations/${op.id}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-foreground">
                            {op.operationNumber}
                          </p>
                          <Badge
                            variant="outline"
                            className="border-secondary/50 text-secondary"
                          >
                            {op.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">
                              {op.origin} → {op.destination}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(op.scheduledStartDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Operation History */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Package className="w-5 h-5 text-success" />
                  Historial de Operaciones
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Últimas {operationHistory.length} operaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {operationHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay historial de operaciones
                  </div>
                ) : (
                  <div className="space-y-3">
                    {operationHistory.map((op) => (
                      <div
                        key={op.id}
                        className="p-4 bg-ui-surface-elevated rounded-lg border border-border hover:bg-card cursor-pointer transition-colors"
                        onClick={() => router.push(`/operations/${op.id}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-foreground">
                            {op.operationNumber}
                          </p>
                          <Badge
                            variant="outline"
                            className="border-success/50 text-success"
                          >
                            {op.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">
                              {op.origin} → {op.destination}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(op.scheduledStartDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
