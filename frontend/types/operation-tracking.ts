/**
 * Operation Tracking and Monitoring Types
 * Enhanced types for operation status tracking, GPS integration, documents, and incidents
 */

// ============================================================================
// OPERATION STAGES & STATUS
// ============================================================================

export const OPERATION_STAGES = [
  { value: "scheduled", label: "Programada", color: "blue", order: 1 },
  { value: "in-transit", label: "En Tránsito", color: "yellow", order: 2 },
  { value: "at-site", label: "En Faena", color: "purple", order: 3 },
  { value: "completed", label: "Finalizada", color: "green", order: 4 },
] as const;

export type OperationStage = (typeof OPERATION_STAGES)[number]["value"];

// ============================================================================
// GPS & TRACKING
// ============================================================================

export interface GPSLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp: string;
}

export interface VehicleGPSStatus {
  vehicleId: number;
  plateNumber: string;
  currentLocation: GPSLocation;
  speed?: number; // km/h
  heading?: number; // degrees
  isMoving: boolean;
  lastUpdate: string;
  gpsProvider?: string; // e.g., "Proveedor GPS XYZ"
  connectionStatus: "connected" | "disconnected" | "offline";
}

export interface RouteProgress {
  totalDistance: number; // km
  completedDistance: number; // km
  progressPercentage: number; // 0-100
  estimatedArrival: string;
  estimatedRemainingTime: number; // minutes
}

// ============================================================================
// OPERATION EVENTS & TIMELINE
// ============================================================================

export interface OperationEvent {
  id: number;
  operationId: number;
  eventType:
    | "status_change"
    | "location_update"
    | "document_upload"
    | "incident_reported"
    | "comment_added"
    | "delay_reported"
    | "arrival"
    | "departure";
  eventStage: OperationStage;
  description: string;
  timestamp: string;
  userId?: number;
  userName?: string;
  metadata?: Record<string, unknown>;
  location?: GPSLocation;
}

// ============================================================================
// DOCUMENTS & EVIDENCE
// ============================================================================

export const DOCUMENT_TYPES = [
  { value: "photo_origin", label: "Foto en Origen" },
  { value: "photo_destination", label: "Foto en Destino" },
  { value: "photo_cargo", label: "Foto de Carga" },
  { value: "photo_damage", label: "Foto de Daño" },
  { value: "signature", label: "Firma de Entrega" },
  { value: "delivery_note", label: "Nota de Entrega" },
  { value: "receipt", label: "Comprobante" },
  { value: "other", label: "Otro" },
] as const;

export interface OperationDocument {
  id: number;
  operationId: number;
  documentType: (typeof DOCUMENT_TYPES)[number]["value"];
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
  uploadedBy?: number;
  uploadedByName?: string;
  stage: OperationStage;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UploadDocumentInput {
  operationId: number;
  documentType: (typeof DOCUMENT_TYPES)[number]["value"];
  stage: OperationStage;
  file: File;
  description?: string;
}

// ============================================================================
// SIGNATURES
// ============================================================================

export interface DeliverySignature {
  id: number;
  operationId: number;
  signatureData: string; // Base64 encoded signature image
  signerName: string;
  signerRut?: string;
  signerRole?: string; // e.g., "Supervisor de Faena"
  signedAt: string;
  location?: GPSLocation;
  notes?: string;
}

export interface CreateSignatureInput {
  operationId: number;
  signatureData: string;
  signerName: string;
  signerRut?: string;
  signerRole?: string;
  notes?: string;
}

// ============================================================================
// COMMENTS & OBSERVATIONS
// ============================================================================

export interface OperationComment {
  id: number;
  operationId: number;
  userId: number;
  userName: string;
  userRole?: string;
  comment: string;
  stage: OperationStage;
  isInternal: boolean; // Internal comments vs client-visible
  createdAt: string;
  updatedAt?: string;
  attachments?: string[]; // URLs to attached files
}

export interface CreateCommentInput {
  operationId: number;
  comment: string;
  stage: OperationStage;
  isInternal?: boolean;
}

// ============================================================================
// INCIDENTS & ALERTS
// ============================================================================

export const INCIDENT_TYPES = [
  { value: "delay", label: "Retraso" },
  { value: "breakdown", label: "Avería" },
  { value: "accident", label: "Accidente" },
  { value: "weather", label: "Condición Climática" },
  { value: "road_closure", label: "Cierre de Vía" },
  { value: "cargo_damage", label: "Daño a Carga" },
  { value: "document_issue", label: "Problema Documental" },
  { value: "client_issue", label: "Problema con Cliente" },
  { value: "other", label: "Otro" },
] as const;

export const INCIDENT_SEVERITY = [
  { value: "low", label: "Baja", color: "green" },
  { value: "medium", label: "Media", color: "yellow" },
  { value: "high", label: "Alta", color: "orange" },
  { value: "critical", label: "Crítica", color: "red" },
] as const;

export interface OperationIncident {
  id: number;
  operationId: number;
  incidentType: (typeof INCIDENT_TYPES)[number]["value"];
  severity: (typeof INCIDENT_SEVERITY)[number]["value"];
  title: string;
  description: string;
  reportedAt: string;
  reportedBy: number;
  reportedByName: string;
  stage: OperationStage;
  location?: GPSLocation;
  estimatedDelay?: number; // minutes
  resolvedAt?: string | null;
  resolvedBy?: number | null;
  resolvedByName?: string | null;
  resolution?: string | null;
  photos?: string[]; // URLs to photos
  status: "open" | "in_progress" | "resolved" | "dismissed";
}

export interface CreateIncidentInput {
  operationId: number;
  incidentType: (typeof INCIDENT_TYPES)[number]["value"];
  severity: (typeof INCIDENT_SEVERITY)[number]["value"];
  title: string;
  description: string;
  stage: OperationStage;
  estimatedDelay?: number;
  photos?: File[];
}

export interface ResolveIncidentInput {
  resolution: string;
  photos?: File[];
}

// ============================================================================
// ALERTS
// ============================================================================

export interface OperationAlert {
  id: number;
  operationId: number;
  alertType:
    | "delay"
    | "milestone"
    | "document_missing"
    | "gps_offline"
    | "custom";
  severity: (typeof INCIDENT_SEVERITY)[number]["value"];
  title: string;
  message: string;
  createdAt: string;
  acknowledgedAt?: string | null;
  acknowledgedBy?: number | null;
  dismissed: boolean;
}

// ============================================================================
// OPERATION REPORT (PDF Generation)
// ============================================================================

export interface OperationReport {
  operationId: number;
  operationNumber: string;
  generatedAt: string;
  generatedBy: number;
  reportUrl: string;

  // Logistic Information
  client?: string;
  provider?: string;
  route: {
    origin: string;
    destination: string;
    distance?: number;
  };
  dates: {
    scheduled: {
      start: string;
      end?: string;
    };
    actual: {
      start?: string;
      end?: string;
    };
  };
  driver: {
    name: string;
    license: string;
  };
  vehicle: {
    plateNumber: string;
    type: string;
  };

  // Timeline
  timeline: OperationEvent[];

  // Documents
  documents: OperationDocument[];

  // Signature
  signature?: DeliverySignature;

  // Incidents
  incidents: OperationIncident[];

  // Comments
  observations: string[];

  // Metrics
  metrics: {
    totalDuration?: number; // minutes
    delay?: number; // minutes
    distanceTraveled?: number; // km
  };
}

export interface GenerateReportInput {
  operationId: number;
  includePhotos?: boolean;
  includeTimeline?: boolean;
  includeIncidents?: boolean;
  language?: "es" | "en";
}

// ============================================================================
// COMPLETE OPERATION TRACKING DATA
// ============================================================================

export interface OperationTrackingData {
  operation: {
    id: number;
    operationNumber: string;
    operationType: string;
    status: string;
    currentStage: OperationStage;
    origin: string;
    destination: string;
    scheduledStartDate: string;
    scheduledEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
  };

  client?: {
    id: number;
    businessName: string;
    contactName?: string;
    contactPhone?: string;
  };

  provider?: {
    id: number;
    businessName: string;
    contactName?: string;
    contactPhone?: string;
  };

  driver: {
    id: number;
    name: string;
    phone?: string;
    licenseType: string;
  };

  vehicle: {
    id: number;
    plateNumber: string;
    brand?: string;
    model?: string;
    type: string;
  };

  route?: {
    id: number;
    name: string;
    distance?: number;
  };

  // GPS & Tracking
  gpsStatus?: VehicleGPSStatus;
  routeProgress?: RouteProgress;

  // Timeline
  timeline: OperationEvent[];

  // Documents
  documents: OperationDocument[];

  // Signature
  signature?: DeliverySignature;

  // Comments
  comments: OperationComment[];

  // Incidents
  incidents: OperationIncident[];

  // Alerts
  alerts: OperationAlert[];
}
