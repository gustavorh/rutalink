/**
 * Operations Types
 * Types for the Operations (Programación de Operaciones) module
 */

// ============================================================================
// OPERATION TYPES & STATUS
// ============================================================================

export const OPERATION_TYPES = [
  { value: "delivery", label: "Entrega (Bodega → Faena)" },
  { value: "pickup", label: "Retiro (Faena → Bodega)" },
  { value: "transfer", label: "Traslado" },
  { value: "transport", label: "Transporte de Maquinaria" },
  { value: "service", label: "Servicio" },
] as const;

export const OPERATION_STATUS = [
  { value: "scheduled", label: "Programada", color: "blue" },
  { value: "confirmed", label: "Confirmada", color: "cyan" },
  { value: "in-progress", label: "En Progreso", color: "yellow" },
  { value: "completed", label: "Completada", color: "green" },
  { value: "cancelled", label: "Cancelada", color: "red" },
  { value: "delayed", label: "Retrasada", color: "orange" },
] as const;

export const MACHINERY_TYPES = [
  { value: "excavadora", label: "Excavadora" },
  { value: "bulldozer", label: "Bulldozer" },
  { value: "retroexcavadora", label: "Retroexcavadora" },
  { value: "cargador_frontal", label: "Cargador Frontal" },
  { value: "grua", label: "Grúa" },
  { value: "camion_tolva", label: "Camión Tolva" },
  { value: "motoniveladora", label: "Motoniveladora" },
  { value: "rodillo", label: "Rodillo Compactador" },
  { value: "otra", label: "Otra Maquinaria" },
] as const;

// ============================================================================
// OPERATION INTERFACES
// ============================================================================

export interface Operation {
  id: number;
  operatorId: number;
  clientId?: number | null;
  providerId?: number | null;
  routeId?: number | null;
  driverId: number;
  vehicleId: number;
  operationNumber: string;
  operationType: string;
  origin: string;
  destination: string;
  scheduledStartDate: string;
  scheduledEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  distance?: number | null;
  status: string;
  cargoDescription?: string | null;
  cargoWeight?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface OperationWithDetails {
  operation: Operation;
  client?: {
    id: number;
    businessName: string;
    contactName?: string | null;
    contactPhone?: string | null;
    industry?: string | null;
  } | null;
  provider?: {
    id: number;
    businessName: string;
    contactName?: string | null;
    contactPhone?: string | null;
    businessType?: string | null;
  } | null;
  route?: {
    id: number;
    name: string;
    code?: string | null;
    origin: string;
    destination: string;
    distance?: number | null;
    estimatedDuration?: number | null;
  } | null;
  driver: {
    id: number;
    firstName: string;
    lastName: string;
    rut: string;
    phone?: string | null;
    licenseType: string;
  };
  vehicle: {
    id: number;
    plateNumber: string;
    brand?: string | null;
    model?: string | null;
    vehicleType: string;
    capacity?: number | null;
  };
}

// ============================================================================
// OPERATION REQUEST INPUT TYPES
// ============================================================================


// ============================================================================
// TRANSPORT ASSIGNMENT TYPES
// ============================================================================

export interface TransportAssignment {
  id: number;
  operationId: number;
  providerId: number;
  assignedAt: string;
  confirmedAt?: string | null;
  confirmedBy?: number | null;
  assignedVehicle?: string | null; // Placa del vehículo asignado por el proveedor
  assignedDriver?: string | null; // Nombre del chofer asignado por el proveedor
  instructions?: string | null;
  status: "pending" | "confirmed" | "rejected" | "completed";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}


// ============================================================================
// QUERY PARAMETERS
// ============================================================================


// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginatedOperations {
  data: OperationWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// CALENDAR & SCHEDULING TYPES
// ============================================================================

export interface CalendarOperation {
  id: number;
  operationNumber: string;
  operationType: string;
  status: string;
  scheduledStartDate: string;
  scheduledEndDate?: string | null;
  client?: string;
  origin: string;
  destination: string;
  driver: string;
  vehicle: string;
  provider?: string | null;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  operations: CalendarOperation[];
  totalOperations: number;
  statusBreakdown: {
    scheduled: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    delayed: number;
  };
}

export interface WeekSchedule {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  days: DaySchedule[];
}

export interface MonthSchedule {
  month: number; // 1-12
  year: number;
  days: DaySchedule[];
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

export interface OperationStatistics {
  totalOperations: number;
  completedOperations: number;
  scheduledOperations: number;
  inProgressOperations: number;
  cancelledOperations: number;
  delayedOperations: number;
  totalDistance: number;
  averageDistance: number;
  operationsByType: Record<string, number>;
  operationsByStatus: Record<string, number>;
  operationsByClient: Array<{
    clientId: number;
    clientName: string;
    totalOperations: number;
  }>;
  operationsByProvider: Array<{
    providerId: number;
    providerName: string;
    totalOperations: number;
  }>;
  recentOperations: OperationWithDetails[];
}

// ============================================================================
// NOTIFICATIONS & ALERTS
// ============================================================================

export interface OperationAlert {
  id: number;
  operationId: number;
  operationNumber: string;
  alertType:
    | "delay"
    | "conflict"
    | "confirmation_pending"
    | "expiring_document";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  createdAt: string;
  resolvedAt?: string | null;
}

// ============================================================================
// TRANSPORT ORDER (Orden de Transporte)
// ============================================================================

export interface TransportOrder {
  id: number;
  operationId: number;
  operation: OperationWithDetails;
  providerId: number;
  provider: {
    id: number;
    businessName: string;
    contactName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
  };
  orderNumber: string;
  issuedAt: string;
  confirmedAt?: string | null;
  status:
    | "issued"
    | "sent"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled";
  instructions?: string | null;
  specialRequirements?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  notes?: string | null;
  documents?: string[]; // URLs to attached documents
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransportOrderInput {
  operationId: number;
  providerId: number;
  instructions?: string;
  specialRequirements?: string;
  estimatedCost?: number;
  sendNotification?: boolean;
}
