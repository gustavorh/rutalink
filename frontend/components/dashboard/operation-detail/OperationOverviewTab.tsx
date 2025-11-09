"use client";

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
      {/* Basic Information - Compact single row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-card/50 border border-border/50">
        <InfoField
          label="Número de Operación"
          value={operation.operationNumber}
        />
        <InfoField
          label="Tipo"
          value={getOperationTypeLabel(operation.operationType)}
        />
        <InfoField
          label="Estado"
          value={
            <Badge className="font-normal" variant="secondary">
              {operation.status}
            </Badge>
          }
        />
        <InfoField
          label="Etapa Actual"
          value={getCurrentStageLabel(operation.currentStage)}
        />
      </div>

      {/* Route Information - Simplified horizontal layout */}
      <div className="p-4 rounded-lg bg-card/50 border border-border/50">
        <h3 className="text-sm font-medium text-foreground mb-3">Ruta</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-0.5">Origen</div>
            <div className="text-sm text-foreground font-medium">
              {operation.origin}
            </div>
          </div>
          <svg
            className="w-5 h-5 text-primary/60 flex-shrink-0"
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
            <div className="text-xs text-muted-foreground mb-0.5">Destino</div>
            <div className="text-sm text-foreground font-medium">
              {operation.destination}
            </div>
          </div>
          {route?.name && (
            <>
              <div className="h-8 w-px bg-border/50" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-0.5">
                  Ruta Asignada
                </div>
                <div className="text-sm text-foreground font-medium">
                  {route.name}
                </div>
              </div>
            </>
          )}
          {route?.distance && (
            <>
              <div className="h-8 w-px bg-border/50" />
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">
                  Distancia
                </div>
                <div className="text-sm text-foreground font-medium">
                  {route.distance} km
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Participants - More compact cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Driver */}
        <div className="p-3 rounded-lg bg-card/50 border border-border/50">
          <h3 className="text-xs font-medium text-muted-foreground mb-2.5">
            Conductor
          </h3>
          <div className="space-y-1.5">
            <div>
              <div className="text-xs text-muted-foreground/80">Nombre</div>
              <div className="text-sm text-foreground font-medium">
                {driver.name}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground/80">
                Tipo de Licencia
              </div>
              <div className="text-sm text-foreground font-medium">
                {driver.licenseType}
              </div>
            </div>
            {driver.phone && (
              <div>
                <div className="text-xs text-muted-foreground/80">Teléfono</div>
                <div className="text-sm text-foreground font-medium">
                  {driver.phone}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle */}
        <div className="p-3 rounded-lg bg-card/50 border border-border/50">
          <h3 className="text-xs font-medium text-muted-foreground mb-2.5">
            Vehículo
          </h3>
          <div className="space-y-1.5">
            <div>
              <div className="text-xs text-muted-foreground/80">Patente</div>
              <div className="text-sm text-foreground font-medium">
                {vehicle.plateNumber}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground/80">Tipo</div>
              <div className="text-sm text-foreground font-medium">
                {vehicle.type}
              </div>
            </div>
            {vehicle.brand && vehicle.model && (
              <div>
                <div className="text-xs text-muted-foreground/80">
                  Marca/Modelo
                </div>
                <div className="text-sm text-foreground font-medium">
                  {vehicle.brand} {vehicle.model}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Client */}
        {client && (
          <div className="p-3 rounded-lg bg-card/50 border border-border/50">
            <h3 className="text-xs font-medium text-muted-foreground mb-2.5">
              Cliente
            </h3>
            <div className="space-y-1.5">
              <div>
                <div className="text-xs text-muted-foreground/80">Empresa</div>
                <div className="text-sm text-foreground font-medium">
                  {client.businessName}
                </div>
              </div>
              {client.contactName && (
                <div>
                  <div className="text-xs text-muted-foreground/80">
                    Contacto
                  </div>
                  <div className="text-sm text-foreground font-medium">
                    {client.contactName}
                  </div>
                </div>
              )}
              {client.contactPhone && (
                <div>
                  <div className="text-xs text-muted-foreground/80">
                    Teléfono
                  </div>
                  <div className="text-sm text-foreground font-medium">
                    {client.contactPhone}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Provider */}
        {provider && (
          <div className="p-3 rounded-lg bg-card/50 border border-border/50">
            <h3 className="text-xs font-medium text-muted-foreground mb-2.5">
              Proveedor
            </h3>
            <div className="space-y-1.5">
              <div>
                <div className="text-xs text-muted-foreground/80">Empresa</div>
                <div className="text-sm text-foreground font-medium">
                  {provider.businessName}
                </div>
              </div>
              {provider.contactName && (
                <div>
                  <div className="text-xs text-muted-foreground/80">
                    Contacto
                  </div>
                  <div className="text-sm text-foreground font-medium">
                    {provider.contactName}
                  </div>
                </div>
              )}
              {provider.contactPhone && (
                <div>
                  <div className="text-xs text-muted-foreground/80">
                    Teléfono
                  </div>
                  <div className="text-sm text-foreground font-medium">
                    {provider.contactPhone}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Schedule - Horizontal compact layout */}
      <div className="p-4 rounded-lg bg-card/50 border border-border/50">
        <h3 className="text-sm font-medium text-foreground mb-3">
          Programación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Fechas Programadas
            </div>
            <div className="space-y-1.5">
              <div>
                <div className="text-xs text-muted-foreground/80">Inicio</div>
                <div className="text-sm text-foreground font-medium">
                  {new Date(operation.scheduledStartDate).toLocaleString(
                    "es-CL",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </div>
              </div>
              {operation.scheduledEndDate && (
                <div>
                  <div className="text-xs text-muted-foreground/80">Fin</div>
                  <div className="text-sm text-foreground font-medium">
                    {new Date(operation.scheduledEndDate).toLocaleString(
                      "es-CL",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Fechas Reales
            </div>
            <div className="space-y-1.5">
              {operation.actualStartDate ? (
                <div>
                  <div className="text-xs text-muted-foreground/80">
                    Inicio Real
                  </div>
                  <div className="text-sm text-foreground font-medium">
                    {new Date(operation.actualStartDate).toLocaleString(
                      "es-CL",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground/60">
                  Aún no ha iniciado
                </div>
              )}
              {operation.actualEndDate && (
                <div>
                  <div className="text-xs text-muted-foreground/80">
                    Fin Real
                  </div>
                  <div className="text-sm text-foreground font-medium">
                    {new Date(operation.actualEndDate).toLocaleString("es-CL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground font-medium">{value}</div>
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
