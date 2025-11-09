"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  OperationTrackingData,
  OperationEvent,
} from "@/types/operation-tracking";

interface OperationTimelineTabProps {
  trackingData: OperationTrackingData;
  loading: boolean;
}

export function OperationTimelineTab({
  trackingData,
  loading,
}: OperationTimelineTabProps) {
  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Cargando...</div>
    );
  }

  const sortedEvents = [...trackingData.timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Bitácora de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Registro cronológico de todos los eventos y cambios de estado de la
            operación
          </p>
        </CardContent>
      </Card>

      {/* Timeline */}
      {sortedEvents.length > 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

              {/* Events */}
              <div className="space-y-6">
                {sortedEvents.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isFirst={index === 0}
                    isLast={index === sortedEvents.length - 1}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
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
              <p>No hay eventos registrados</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Eventos</p>
                <p className="text-2xl font-bold text-foreground">
                  {sortedEvents.length}
                </p>
              </div>
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Cambios de Estado
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    sortedEvents.filter((e) => e.eventType === "status_change")
                      .length
                  }
                </p>
              </div>
              <svg
                className="w-10 h-10 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Documentos Subidos
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    sortedEvents.filter(
                      (e) => e.eventType === "document_upload"
                    ).length
                  }
                </p>
              </div>
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface EventCardProps {
  event: OperationEvent;
  isFirst: boolean;
  isLast: boolean;
}

function EventCard({ event, isFirst }: EventCardProps) {
  const eventIcon = getEventIcon(event.eventType);
  const eventColor = getEventColor(event.eventType);

  return (
    <div className="relative pl-16">
      {/* Icon Circle */}
      <div
        className={`absolute left-5 w-6 h-6 rounded-full flex items-center justify-center ${eventColor} ${
          isFirst ? "ring-4 ring-primary/20" : ""
        }`}
      >
        {eventIcon}
      </div>

      {/* Content */}
      <div className="bg-muted rounded-lg p-4 border border-border">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {getStageLabel(event.eventStage)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {getEventTypeLabel(event.eventType)}
              </Badge>
            </div>
            <p className="text-foreground font-medium">{event.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatEventTime(event.timestamp)}
            </div>
            {event.userName && (
              <div className="flex items-center gap-1">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {event.userName}
              </div>
            )}
          </div>
        </div>

        {event.location && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <svg
              className="w-3 h-3"
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
            </svg>
            {event.location.latitude.toFixed(6)},{" "}
            {event.location.longitude.toFixed(6)}
          </div>
        )}

        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Ver detalles adicionales
              </summary>
              <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case "status_change":
      return (
        <svg
          className="w-3 h-3 text-white"
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
      );
    case "location_update":
      return (
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
        </svg>
      );
    case "document_upload":
      return (
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    case "incident_reported":
      return (
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    case "departure":
    case "arrival":
      return (
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      );
    default:
      return (
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

function getEventColor(eventType: string): string {
  switch (eventType) {
    case "status_change":
      return "bg-blue-500";
    case "location_update":
      return "bg-purple-500";
    case "document_upload":
      return "bg-green-500";
    case "incident_reported":
      return "bg-red-500";
    case "comment_added":
      return "bg-yellow-500";
    case "delay_reported":
      return "bg-orange-500";
    case "arrival":
    case "departure":
      return "bg-primary";
    default:
      return "bg-gray-500";
  }
}

function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    status_change: "Cambio de Estado",
    location_update: "Actualización de Ubicación",
    document_upload: "Documento Subido",
    incident_reported: "Incidente Reportado",
    comment_added: "Comentario Añadido",
    delay_reported: "Retraso Reportado",
    arrival: "Llegada",
    departure: "Salida",
  };
  return labels[eventType] || eventType;
}

function getStageLabel(stage: string): string {
  const stages: Record<string, string> = {
    scheduled: "Programada",
    "in-transit": "En Tránsito",
    "at-site": "En Faena",
    completed: "Finalizada",
  };
  return stages[stage] || stage;
}

function formatEventTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return date.toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
