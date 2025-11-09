"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OperationTrackingData } from "@/types/operation-tracking";

interface OperationOverviewTabProps {
  trackingData: OperationTrackingData;
  loading: boolean;
}

export function OperationOverviewTab({
  trackingData,
  loading,
}: OperationOverviewTabProps) {
  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Cargando...</div>
    );
  }

  const { operation, client, provider, driver, vehicle, route } = trackingData;

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField
            label="Número de Operación"
            value={operation.operationNumber}
          />
          <InfoField
            label="Tipo"
            value={getOperationTypeLabel(operation.operationType)}
          />
          <InfoField label="Estado" value={<Badge>{operation.status}</Badge>} />
          <InfoField
            label="Etapa Actual"
            value={getCurrentStageLabel(operation.currentStage)}
          />
        </CardContent>
      </Card>

      {/* Route Information */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Ruta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Origen</div>
              <div className="text-foreground font-medium">
                {operation.origin}
              </div>
            </div>
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Destino</div>
              <div className="text-foreground font-medium">
                {operation.destination}
              </div>
            </div>
          </div>
          {route && <InfoField label="Ruta Asignada" value={route.name} />}
          {route?.distance && (
            <InfoField label="Distancia" value={`${route.distance} km`} />
          )}
        </CardContent>
      </Card>

      {/* Participants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client */}
        {client && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoField label="Empresa" value={client.businessName} />
              {client.contactName && (
                <InfoField label="Contacto" value={client.contactName} />
              )}
              {client.contactPhone && (
                <InfoField label="Teléfono" value={client.contactPhone} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Provider */}
        {provider && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                Proveedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoField label="Empresa" value={provider.businessName} />
              {provider.contactName && (
                <InfoField label="Contacto" value={provider.contactName} />
              )}
              {provider.contactPhone && (
                <InfoField label="Teléfono" value={provider.contactPhone} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Driver */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Conductor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoField label="Nombre" value={driver.name} />
            <InfoField label="Tipo de Licencia" value={driver.licenseType} />
            {driver.phone && (
              <InfoField label="Teléfono" value={driver.phone} />
            )}
          </CardContent>
        </Card>

        {/* Vehicle */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Vehículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoField label="Patente" value={vehicle.plateNumber} />
            <InfoField label="Tipo" value={vehicle.type} />
            {vehicle.brand && vehicle.model && (
              <InfoField
                label="Marca/Modelo"
                value={`${vehicle.brand} ${vehicle.model}`}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Programación
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-foreground mb-2">
              Fechas Programadas
            </div>
            <InfoField
              label="Inicio"
              value={new Date(operation.scheduledStartDate).toLocaleString(
                "es-CL"
              )}
            />
            {operation.scheduledEndDate && (
              <InfoField
                label="Fin"
                value={new Date(operation.scheduledEndDate).toLocaleString(
                  "es-CL"
                )}
              />
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-foreground mb-2">
              Fechas Reales
            </div>
            {operation.actualStartDate ? (
              <InfoField
                label="Inicio Real"
                value={new Date(operation.actualStartDate).toLocaleString(
                  "es-CL"
                )}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Aún no ha iniciado
              </div>
            )}
            {operation.actualEndDate && (
              <InfoField
                label="Fin Real"
                value={new Date(operation.actualEndDate).toLocaleString(
                  "es-CL"
                )}
              />
            )}
          </div>
        </CardContent>
      </Card>
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

function getOperationTypeLabel(type: string): string {
  const types: Record<string, string> = {
    delivery: "Entrega",
    pickup: "Retiro",
    transfer: "Traslado",
    transport: "Transporte",
    service: "Servicio",
  };
  return types[type] || type;
}

function getCurrentStageLabel(stage: string): string {
  const stages: Record<string, string> = {
    scheduled: "Programada",
    "in-transit": "En Tránsito",
    "at-site": "En Faena",
    completed: "Finalizada",
  };
  return stages[stage] || stage;
}
