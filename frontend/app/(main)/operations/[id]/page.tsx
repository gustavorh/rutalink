"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, isAuthenticated } from "@/lib/auth";
import { getOperationById } from "@/lib/api";
import type { OperationWithDetails } from "@/types/operations";
import type {
  OperationTrackingData,
  OperationStage,
  OperationEvent,
} from "@/types/operation-tracking";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  FileText,
  Clock,
  AlertTriangle,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperationOverviewTab } from "@/components/dashboard/operation-detail/OperationOverviewTab";
import { OperationStatusTab } from "@/components/dashboard/operation-detail/OperationStatusTab";
import { OperationDocumentsTab } from "@/components/dashboard/operation-detail/OperationDocumentsTab";
import { OperationIncidentsTab } from "@/components/dashboard/operation-detail/OperationIncidentsTab";
import { OperationTimelineTab } from "@/components/dashboard/operation-detail/OperationTimelineTab";

type TabType = "overview" | "status" | "documents" | "incidents" | "timeline";

export default function OperationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const operationId = parseInt(params.id as string);

  const [mounted, setMounted] = useState(false);
  const [operation, setOperation] = useState<OperationWithDetails | null>(null);
  const [trackingData, setTrackingData] =
    useState<OperationTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchOperationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operationId]);

  const fetchOperationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const operationData = await getOperationById(token, operationId);
      setOperation(operationData);

      // Generate tracking data
      const tracking = generateTrackingData(operationData);
      setTrackingData(tracking);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar datos de la operación"
      );
    } finally {
      setLoading(false);
    }
  };

  const generateTrackingData = (
    op: OperationWithDetails
  ): OperationTrackingData => {
    return {
      operation: {
        id: op.operation.id,
        operationNumber: op.operation.operationNumber,
        operationType: op.operation.operationType,
        status: op.operation.status,
        currentStage: mapStatusToStage(op.operation.status),
        origin: op.operation.origin,
        destination: op.operation.destination,
        scheduledStartDate: op.operation.scheduledStartDate,
        scheduledEndDate: op.operation.scheduledEndDate || undefined,
        actualStartDate: op.operation.actualStartDate || undefined,
        actualEndDate: op.operation.actualEndDate || undefined,
      },
      client: op.client
        ? {
            id: op.client.id,
            businessName: op.client.businessName,
            contactName: op.client.contactName || undefined,
            contactPhone: op.client.contactPhone || undefined,
          }
        : undefined,
      provider: op.provider
        ? {
            id: op.provider.id,
            businessName: op.provider.businessName,
            contactName: op.provider.contactName || undefined,
            contactPhone: op.provider.contactPhone || undefined,
          }
        : undefined,
      driver: {
        id: op.driver.id,
        name: `${op.driver.firstName} ${op.driver.lastName}`,
        phone: op.driver.phone || undefined,
        licenseType: op.driver.licenseType,
      },
      vehicle: {
        id: op.vehicle.id,
        plateNumber: op.vehicle.plateNumber,
        brand: op.vehicle.brand || undefined,
        model: op.vehicle.model || undefined,
        type: op.vehicle.vehicleType,
      },
      route: op.route
        ? {
            id: op.route.id,
            name: op.route.name,
            distance: op.route.distance || undefined,
          }
        : undefined,
      gpsStatus: undefined,
      routeProgress:
        op.operation.status === "in-progress"
          ? {
              totalDistance: op.operation.distance || 0,
              completedDistance:
                (op.operation.distance || 0) * (Math.random() * 0.7 + 0.2),
              progressPercentage: Math.floor(Math.random() * 60 + 20),
              estimatedArrival: new Date(
                Date.now() + Math.random() * 7200000
              ).toISOString(),
              estimatedRemainingTime: Math.floor(Math.random() * 120),
            }
          : undefined,
      timeline: generateMockTimeline(op),
      documents: [],
      signature: undefined,
      comments: [],
      incidents: [],
      alerts: [],
    };
  };

  const mapStatusToStage = (status: string): OperationStage => {
    switch (status) {
      case "scheduled":
      case "confirmed":
        return "scheduled";
      case "in-progress":
        return "in-transit";
      case "completed":
        return "completed";
      default:
        return "scheduled";
    }
  };

  const generateMockTimeline = (op: OperationWithDetails): OperationEvent[] => {
    const events: OperationEvent[] = [];

    events.push({
      id: 1,
      operationId: op.operation.id,
      eventType: "status_change",
      eventStage: "scheduled",
      description: "Operación creada y programada",
      timestamp: op.operation.createdAt,
      userName: "Sistema",
    });

    if (op.operation.actualStartDate) {
      events.push({
        id: 2,
        operationId: op.operation.id,
        eventType: "departure",
        eventStage: "in-transit",
        description: "Vehículo salió de origen",
        timestamp: op.operation.actualStartDate,
        userName: `${op.driver.firstName} ${op.driver.lastName}`,
      });
    }

    return events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      scheduled: {
        label: "Programada",
        className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      },
      confirmed: {
        label: "Confirmada",
        className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      },
      "in-progress": {
        label: "En Tránsito",
        className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      },
      completed: {
        label: "Completada",
        className: "bg-green-500/10 text-green-500 border-green-500/20",
      },
      cancelled: {
        label: "Cancelada",
        className: "bg-red-500/10 text-red-500 border-red-500/20",
      },
    };

    const config = statusConfig[status] || statusConfig.scheduled;

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleGenerateReport = async () => {
    // TODO: Implement PDF report generation
    console.log(
      "Generating PDF report for operation:",
      operation?.operation.id
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
              Cargando información de la operación...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !operation || !trackingData) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">
              {error || "Operación no encontrada"}
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
              onClick={() => router.push("/operations")}
              className="border-border text-foreground hover:bg-card"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-secondary" />
                Operación #{operation.operation.operationNumber}
              </h1>
              <p className="text-muted-foreground mt-1">
                {operation.operation.origin} → {operation.operation.destination}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateReport}
              className="border-border text-foreground hover:bg-ui-surface-elevated"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generar PDF
            </Button>
            <Button
              onClick={() =>
                router.push(`/operations?edit=${operation.operation.id}`)
              }
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex gap-2">
          {getStatusBadge(operation.operation.status)}
          <Badge
            variant="outline"
            className="border-primary/50 text-primary capitalize"
          >
            {operation.operation.operationType}
          </Badge>
        </div>

        {/* Tabs */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as TabType)}
            >
              <div className="border-b border-border px-6 pt-6">
                <TabsList className="grid w-full grid-cols-5 bg-muted">
                  <TabsTrigger
                    value="overview"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger
                    value="status"
                    className="flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Estado
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Documentos
                  </TabsTrigger>
                  <TabsTrigger
                    value="incidents"
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Incidentes
                    {trackingData.incidents.length > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                      >
                        {trackingData.incidents.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="timeline"
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Línea de Tiempo
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="overview" className="mt-0">
                  <OperationOverviewTab
                    trackingData={trackingData}
                    loading={loading}
                  />
                </TabsContent>

                <TabsContent value="status" className="mt-0">
                  <OperationStatusTab
                    trackingData={trackingData}
                    loading={loading}
                    onStageChange={fetchOperationData}
                  />
                </TabsContent>

                <TabsContent value="documents" className="mt-0">
                  <OperationDocumentsTab
                    trackingData={trackingData}
                    loading={loading}
                    onDocumentUpload={fetchOperationData}
                  />
                </TabsContent>

                <TabsContent value="incidents" className="mt-0">
                  <OperationIncidentsTab
                    trackingData={trackingData}
                    loading={loading}
                    onIncidentCreate={fetchOperationData}
                  />
                </TabsContent>

                <TabsContent value="timeline" className="mt-0">
                  <OperationTimelineTab
                    trackingData={trackingData}
                    loading={loading}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
