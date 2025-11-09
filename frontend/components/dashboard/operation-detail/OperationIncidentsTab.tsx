"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  OperationTrackingData,
  OperationIncident,
  CreateIncidentInput,
} from "@/types/operation-tracking";
import { INCIDENT_TYPES, INCIDENT_SEVERITY } from "@/types/operation-tracking";

interface OperationIncidentsTabProps {
  trackingData: OperationTrackingData;
  loading: boolean;
  onIncidentCreate: () => void;
}

export function OperationIncidentsTab({
  trackingData,
  loading,
  onIncidentCreate,
}: OperationIncidentsTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreateIncident = async (data: Partial<CreateIncidentInput>) => {
    setCreating(true);
    try {
      // TODO: API call to create incident
      console.log("Creating incident:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setShowCreateForm(false);
      onIncidentCreate();
    } catch (error) {
      console.error("Error creating incident:", error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Cargando...</div>
    );
  }

  const openIncidents = trackingData.incidents.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  );
  const resolvedIncidents = trackingData.incidents.filter(
    (i) => i.status === "resolved"
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Incidentes Activos
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {openIncidents.length}
                </p>
              </div>
              <svg
                className="w-12 h-12 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Críticos</p>
                <p className="text-3xl font-bold text-destructive">
                  {
                    trackingData.incidents.filter(
                      (i) => i.severity === "critical"
                    ).length
                  }
                </p>
              </div>
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resueltos</p>
                <p className="text-3xl font-bold text-green-600">
                  {resolvedIncidents.length}
                </p>
              </div>
              <svg
                className="w-12 h-12 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Button */}
      {!showCreateForm && (
        <Button
          onClick={() => setShowCreateForm(true)}
          className="w-full bg-primary hover:bg-primary/90"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Registrar Nuevo Incidente
        </Button>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <CreateIncidentForm
          operationId={trackingData.operation.id}
          currentStage={trackingData.operation.currentStage}
          onSubmit={handleCreateIncident}
          onCancel={() => setShowCreateForm(false)}
          submitting={creating}
        />
      )}

      {/* Active Incidents */}
      {openIncidents.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Incidentes Activos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {openIncidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Resolved Incidents */}
      {resolvedIncidents.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Incidentes Resueltos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resolvedIncidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Incidents */}
      {trackingData.incidents.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-medium text-foreground">
                Sin Incidentes Registrados
              </p>
              <p className="text-sm mt-1">
                Esta operación no tiene incidentes reportados
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Card className="bg-muted border-border">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-primary flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                Gestión de Incidentes
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Registra incidentes operativos con clasificación por tipo y
                  severidad
                </li>
                <li>Estima el impacto en tiempos y plazos de entrega</li>
                <li>Adjunta fotos y evidencias del incidente</li>
                <li>Documenta la resolución y acciones tomadas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface IncidentCardProps {
  incident: OperationIncident;
}

function IncidentCard({ incident }: IncidentCardProps) {
  const severityColor = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  }[incident.severity];

  const statusLabel = {
    open: "Abierto",
    in_progress: "En Progreso",
    resolved: "Resuelto",
    dismissed: "Descartado",
  }[incident.status];

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${severityColor}`} />
            <h4 className="font-semibold text-foreground">{incident.title}</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {incident.description}
          </p>
        </div>
        <Badge
          variant={incident.status === "resolved" ? "outline" : "destructive"}
        >
          {statusLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
        <div>
          <span className="text-muted-foreground">Tipo:</span>
          <span className="ml-1 text-foreground">
            {INCIDENT_TYPES.find((t) => t.value === incident.incidentType)
              ?.label || incident.incidentType}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Severidad:</span>
          <span className="ml-1 text-foreground">
            {INCIDENT_SEVERITY.find((s) => s.value === incident.severity)
              ?.label || incident.severity}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Reportado:</span>
          <span className="ml-1 text-foreground">
            {new Date(incident.reportedAt).toLocaleDateString("es-CL")}
          </span>
        </div>
        {incident.estimatedDelay && (
          <div>
            <span className="text-muted-foreground">Retraso Est.:</span>
            <span className="ml-1 text-foreground">
              {incident.estimatedDelay} min
            </span>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Reportado por: {incident.reportedByName}
      </div>

      {incident.resolvedAt && incident.resolution && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-sm">
            <div className="font-medium text-green-600 mb-1">Resolución</div>
            <p className="text-muted-foreground">{incident.resolution}</p>
            <div className="text-xs text-muted-foreground mt-2">
              Resuelto por {incident.resolvedByName} el{" "}
              {new Date(incident.resolvedAt).toLocaleDateString("es-CL")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CreateIncidentFormProps {
  operationId: number;
  currentStage: string;
  onSubmit: (data: Partial<CreateIncidentInput>) => void;
  onCancel: () => void;
  submitting: boolean;
}

function CreateIncidentForm({
  operationId,
  currentStage,
  onSubmit,
  onCancel,
  submitting,
}: CreateIncidentFormProps) {
  const [formData, setFormData] = useState({
    incidentType: "delay" as const,
    severity: "medium" as const,
    title: "",
    description: "",
    estimatedDelay: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      operationId,
      stage: currentStage as never,
      ...formData,
      estimatedDelay: formData.estimatedDelay
        ? parseInt(formData.estimatedDelay)
        : undefined,
    });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">
          Registrar Nuevo Incidente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tipo de Incidente
              </label>
              <select
                value={formData.incidentType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    incidentType: e.target.value as never,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                {INCIDENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Severidad
              </label>
              <select
                value={formData.severity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    severity: e.target.value as never,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                {INCIDENT_SEVERITY.map((sev) => (
                  <option key={sev.value} value={sev.value}>
                    {sev.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Título
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              placeholder="Ej: Retraso por condiciones climáticas"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              rows={3}
              placeholder="Describe el incidente en detalle..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Retraso Estimado (minutos)
            </label>
            <input
              type="number"
              value={formData.estimatedDelay}
              onChange={(e) =>
                setFormData({ ...formData, estimatedDelay: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              placeholder="Ej: 30"
              min="0"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Registrando..." : "Registrar Incidente"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
