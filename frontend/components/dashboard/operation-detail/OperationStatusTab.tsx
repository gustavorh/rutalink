"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  OperationTrackingData,
  OperationStage,
} from "@/types/operation-tracking";

interface OperationStatusTabProps {
  trackingData: OperationTrackingData;
  loading: boolean;
  onStageChange: () => void;
}

const STAGES: Array<{ value: OperationStage; label: string; color: string }> = [
  { value: "scheduled", label: "Programada", color: "bg-blue-500" },
  { value: "in-transit", label: "En Tránsito", color: "bg-yellow-500" },
  { value: "at-site", label: "En Faena", color: "bg-purple-500" },
  { value: "completed", label: "Finalizada", color: "bg-green-500" },
];

export function OperationStatusTab({
  trackingData,
  loading,
  onStageChange,
}: OperationStatusTabProps) {
  const [updatingStage, setUpdatingStage] = useState(false);
  const currentStageIndex = STAGES.findIndex(
    (s) => s.value === trackingData.operation.currentStage
  );

  const handleStageChange = async (newStage: OperationStage) => {
    setUpdatingStage(true);
    try {
      // TODO: API call to update operation stage
      console.log("Updating stage to:", newStage);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay
      onStageChange();
    } catch (error) {
      console.error("Error updating stage:", error);
    } finally {
      setUpdatingStage(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Cargando...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stage Progress */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Estados de la Operación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-border">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Stages */}
            <div className="relative flex justify-between">
              {STAGES.map((stage, index) => {
                const isCompleted = index <= currentStageIndex;
                const isCurrent = index === currentStageIndex;

                return (
                  <div key={stage.value} className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all ${
                        isCompleted
                          ? `${stage.color} border-white`
                          : "bg-muted border-border"
                      } ${isCurrent ? "ring-4 ring-primary/30" : ""}`}
                    >
                      {isCompleted ? (
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div
                        className={`text-sm font-medium ${
                          isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stage.label}
                      </div>
                      {isCurrent && (
                        <Badge variant="default" className="mt-1 text-xs">
                          Actual
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stage Actions */}
          {currentStageIndex < STAGES.length - 1 && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={() =>
                  handleStageChange(STAGES[currentStageIndex + 1].value)
                }
                disabled={updatingStage}
                className="bg-primary hover:bg-primary/90"
              >
                {updatingStage
                  ? "Actualizando..."
                  : `Avanzar a: ${STAGES[currentStageIndex + 1].label}`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GPS Integration Placeholder */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-foreground">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Integración GPS
              </div>
            </CardTitle>
            {trackingData.gpsStatus && (
              <Badge
                variant={
                  trackingData.gpsStatus.connectionStatus === "connected"
                    ? "default"
                    : "destructive"
                }
              >
                {trackingData.gpsStatus.connectionStatus === "connected"
                  ? "Conectado"
                  : "Desconectado"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {trackingData.gpsStatus ? (
            <div className="space-y-4">
              {/* GPS Data Display */}
              <div className="grid grid-cols-2 gap-4">
                <InfoField
                  label="Velocidad"
                  value={`${trackingData.gpsStatus.speed || 0} km/h`}
                />
                <InfoField
                  label="Estado"
                  value={
                    trackingData.gpsStatus.isMoving
                      ? "En movimiento"
                      : "Detenido"
                  }
                />
                <InfoField
                  label="Última actualización"
                  value={new Date(
                    trackingData.gpsStatus.lastUpdate
                  ).toLocaleTimeString("es-CL")}
                />
                {trackingData.gpsStatus.gpsProvider && (
                  <InfoField
                    label="Proveedor GPS"
                    value={trackingData.gpsStatus.gpsProvider}
                  />
                )}
              </div>

              {/* Map Placeholder */}
              <div className="mt-4 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center text-muted-foreground">
                  <svg
                    className="w-12 h-12 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <p className="font-medium">
                    Mapa de Ubicación en Tiempo Real
                  </p>
                  <p className="text-sm mt-1">
                    Lat:{" "}
                    {trackingData.gpsStatus.currentLocation.latitude.toFixed(6)}
                    , Lng:{" "}
                    {trackingData.gpsStatus.currentLocation.longitude.toFixed(
                      6
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <svg
                  className="w-8 h-8 text-muted-foreground"
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
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Sistema GPS No Conectado
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                La integración con el sistema GPS del transportista estará
                disponible próximamente. Podrá visualizar la ubicación en tiempo
                real del vehículo y monitorear su progreso.
              </p>
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Conectividad vía API a plataformas GPS
                </div>
                <div className="flex items-center gap-2">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Visualización de ubicación en mapa integrado
                </div>
                <div className="flex items-center gap-2">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Estado del camión en línea
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Progress */}
      {trackingData.routeProgress && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Progreso de Ruta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso</span>
                <span className="text-foreground font-medium">
                  {trackingData.routeProgress.progressPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${trackingData.routeProgress.progressPercentage}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <InfoField
                label="Distancia Total"
                value={`${trackingData.routeProgress.totalDistance} km`}
              />
              <InfoField
                label="Distancia Recorrida"
                value={`${trackingData.routeProgress.completedDistance.toFixed(
                  1
                )} km`}
              />
              <InfoField
                label="Tiempo Restante"
                value={`${Math.floor(
                  trackingData.routeProgress.estimatedRemainingTime / 60
                )}h ${
                  trackingData.routeProgress.estimatedRemainingTime % 60
                }min`}
              />
            </div>

            {trackingData.routeProgress.estimatedArrival && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-primary"
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
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Llegada Estimada
                    </div>
                    <div className="font-medium text-foreground">
                      {new Date(
                        trackingData.routeProgress.estimatedArrival
                      ).toLocaleString("es-CL")}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
}

function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-foreground font-medium">{value}</div>
    </div>
  );
}
