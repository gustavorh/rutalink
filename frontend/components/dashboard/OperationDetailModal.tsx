"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LiveOperation } from "@/types/dashboard";
import type {
  OperationTrackingData,
  OperationStage,
  OperationEvent,
} from "@/types/operation-tracking";
import { OperationOverviewTab } from "./operation-detail/OperationOverviewTab";
import { OperationStatusTab } from "./operation-detail/OperationStatusTab";
import { OperationDocumentsTab } from "./operation-detail/OperationDocumentsTab";
import { OperationIncidentsTab } from "./operation-detail/OperationIncidentsTab";
import { OperationTimelineTab } from "./operation-detail/OperationTimelineTab";

interface OperationDetailModalProps {
  operation: LiveOperation | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function OperationDetailModal({
  operation,
  isOpen,
  onClose,
}: OperationDetailModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [trackingData, setTrackingData] =
    useState<OperationTrackingData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (operation && isOpen) {
      loadTrackingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operation, isOpen]);

  const loadTrackingData = async () => {
    if (!operation) return;

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const data = await getOperationTrackingData(token, operation.operation.id);

      // Mock data for now
      const mockData: OperationTrackingData = {
        operation: {
          id: operation.operation.id,
          operationNumber: operation.operation.operationNumber,
          operationType: operation.operation.operationType,
          status: operation.operation.status,
          currentStage: mapStatusToStage(operation.operation.status),
          origin: operation.operation.origin,
          destination: operation.operation.destination,
          scheduledStartDate: operation.operation.scheduledStartDate,
          scheduledEndDate: operation.operation.scheduledEndDate || undefined,
          actualStartDate: operation.operation.actualStartDate || undefined,
          actualEndDate: operation.operation.actualEndDate || undefined,
        },
        client: operation.client
          ? {
              id: operation.client.id,
              businessName: operation.client.businessName,
              contactName: operation.client.contactName || undefined,
              contactPhone: operation.client.contactPhone || undefined,
            }
          : undefined,
        provider: operation.provider
          ? {
              id: operation.provider.id,
              businessName: operation.provider.businessName,
              contactName: operation.provider.contactName || undefined,
              contactPhone: operation.provider.contactPhone || undefined,
            }
          : undefined,
        driver: {
          id: operation.driver.id,
          name: `${operation.driver.firstName} ${operation.driver.lastName}`,
          phone: operation.driver.phone || undefined,
          licenseType: operation.driver.licenseType,
        },
        vehicle: {
          id: operation.vehicle.id,
          plateNumber: operation.vehicle.plateNumber,
          brand: operation.vehicle.brand || undefined,
          model: operation.vehicle.model || undefined,
          type: operation.vehicle.vehicleType,
        },
        route: operation.route
          ? {
              id: operation.route.id,
              name: operation.route.name,
              distance: operation.route.distance || undefined,
            }
          : undefined,
        gpsStatus: undefined, // Will be populated when GPS integration is ready
        routeProgress:
          operation.operation.status === "in-progress"
            ? {
                totalDistance: operation.operation.distance || 0,
                completedDistance:
                  (operation.operation.distance || 0) *
                  ((operation.actualProgress || 0) / 100),
                progressPercentage: operation.actualProgress || 0,
                estimatedArrival:
                  operation.estimatedArrival || new Date().toISOString(),
                estimatedRemainingTime: Math.floor(Math.random() * 120),
              }
            : undefined,
        timeline: generateMockTimeline(operation),
        documents: [],
        signature: undefined,
        comments: [],
        incidents: [],
        alerts: [],
      };

      setTrackingData(mockData);
    } catch (error) {
      console.error("Error loading tracking data:", error);
    } finally {
      setLoading(false);
    }
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

  const generateMockTimeline = (op: LiveOperation): OperationEvent[] => {
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

  const handleGenerateReport = async () => {
    // TODO: Implement PDF report generation
    console.log(
      "Generating PDF report for operation:",
      operation?.operation.id
    );
  };

  if (!operation || !trackingData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl text-foreground">
                Operación #{operation.operation.operationNumber}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {operation.operation.origin} → {operation.operation.destination}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={getStageVariant(trackingData.operation.currentStage)}
                className="text-xs"
              >
                {getStageLabel(trackingData.operation.currentStage)}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateReport}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Generar PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5 bg-muted">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="status">Estado</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="incidents">
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
            <TabsTrigger value="timeline">Línea de Tiempo</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <OperationOverviewTab
              trackingData={trackingData}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="status" className="mt-4">
            <OperationStatusTab
              trackingData={trackingData}
              loading={loading}
              onStageChange={loadTrackingData}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <OperationDocumentsTab
              trackingData={trackingData}
              loading={loading}
              onDocumentUpload={loadTrackingData}
            />
          </TabsContent>

          <TabsContent value="incidents" className="mt-4">
            <OperationIncidentsTab
              trackingData={trackingData}
              loading={loading}
              onIncidentCreate={loadTrackingData}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <OperationTimelineTab
              trackingData={trackingData}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function getStageVariant(
  stage: OperationStage
): "default" | "secondary" | "destructive" | "outline" {
  switch (stage) {
    case "scheduled":
      return "secondary";
    case "in-transit":
      return "default";
    case "at-site":
      return "outline";
    case "completed":
      return "outline";
    default:
      return "default";
  }
}

function getStageLabel(stage: OperationStage): string {
  switch (stage) {
    case "scheduled":
      return "Programada";
    case "in-transit":
      return "En Tránsito";
    case "at-site":
      return "En Faena";
    case "completed":
      return "Finalizada";
    default:
      return stage;
  }
}
