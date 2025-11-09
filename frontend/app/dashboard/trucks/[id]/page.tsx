"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, isAuthenticated, getUser, logout } from "@/lib/auth";
import {
  getTruckById,
  getTruckDocuments,
  getTruckOperationHistory,
  getTruckUpcomingOperations,
} from "@/lib/api";
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
} from "lucide-react";
import { DashboardSidebar, DashboardHeader } from "@/components/dashboard";

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
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const [truckData, docsData, historyData, upcomingData] =
        await Promise.all([
          getTruckById(token, truckId),
          getTruckDocuments(token, truckId),
          getTruckOperationHistory(token, truckId),
          getTruckUpcomingOperations(token, truckId),
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

  const handleLogout = () => {
    logout();
  };

  const user = getUser();

  // Show loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-surface-elevated">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-foreground mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-surface-elevated">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-6">
            <p className="text-destructive mb-4">{error}</p>
            <Button
              onClick={() => router.push("/dashboard/trucks")}
              className="bg-primary hover:bg-primary-dark text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Camiones
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No user or no truck data
  if (!user || !truck) {
    return null;
  }

  const opStatus = getOperationalStatusInfo(truck.operationalStatus);

  return (
    <div className="flex min-h-screen bg-ui-surface-elevated">
      <DashboardSidebar
        currentPath="/dashboard/trucks"
        onNavigate={(path) => router.push(path)}
      />

      <div className="flex-1 flex flex-col">
        <DashboardHeader user={user} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/trucks")}
                  className="border-border text-foreground hover:bg-card"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <TruckIcon className="w-6 h-6 text-primary" />
                    Detalle del Camión: {truck.plateNumber}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {truck.brand} {truck.model} ({truck.year})
                  </p>
                </div>
              </div>
              <Button
                onClick={() =>
                  router.push(`/dashboard/trucks/${truck.id}/edit`)
                }
                className="bg-primary hover:bg-primary-dark text-white"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>

            {error && (
              <Card className="bg-destructive/10 border-destructive/50">
                <CardContent className="p-4">
                  <p className="text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Basic Information */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Patente
                    </p>
                    <p className="text-lg font-bold text-foreground mt-1">
                      {truck.plateNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Marca</p>
                    <p className="text-lg text-foreground mt-1">
                      {truck.brand || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Modelo</p>
                    <p className="text-lg text-foreground mt-1">
                      {truck.model || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Año</p>
                    <p className="text-lg text-foreground mt-1">
                      {truck.year || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
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
                    <p className="text-xs font-medium text-muted-foreground">
                      Capacidad
                    </p>
                    <p className="text-lg text-foreground mt-1">
                      {truck.capacity
                        ? `${truck.capacity} ${truck.capacityUnit || ""}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">VIN</p>
                    <p className="text-sm font-mono text-foreground mt-1">
                      {truck.vin || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Color</p>
                    <p className="text-lg text-foreground mt-1">
                      {truck.color || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
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
                    <p className="text-xs font-medium text-muted-foreground">Notas</p>
                    <p className="text-sm text-foreground mt-2">{truck.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Documentos ({documents.length})
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Documentación vigente del vehículo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay documentos registrados
                  </p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-ui-surface-elevated rounded-lg border border-border"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {doc.documentName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getDocumentTypeLabel(doc.documentType)}
                          </p>
                        </div>
                        {doc.expirationDate && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              Vencimiento
                            </p>
                            <p className="text-sm text-foreground">
                              {formatDate(doc.expirationDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Operations */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-secondary" />
                    Operaciones Próximas ({upcomingOperations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingOperations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No hay operaciones próximas
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingOperations.slice(0, 5).map((op) => (
                        <div
                          key={op.id}
                          className="p-3 bg-ui-surface-elevated rounded-lg border border-border"
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
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {op.origin} → {op.destination}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {formatDate(op.scheduledStartDate)}
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
                    Historial de Operaciones ({operationHistory.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {operationHistory.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No hay historial de operaciones
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {operationHistory.slice(0, 5).map((op) => (
                        <div
                          key={op.id}
                          className="p-3 bg-ui-surface-elevated rounded-lg border border-border"
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
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {op.origin} → {op.destination}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {formatDate(op.scheduledStartDate)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
