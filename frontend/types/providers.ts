/**
 * Provider Types
 * Types for the Providers (Transport Providers) module
 */

// ============================================================================
// BUSINESS TYPES
// ============================================================================

export const BUSINESS_TYPES = [
  { value: "transporte", label: "Transporte" },
  { value: "logistica", label: "Logística" },
  { value: "operador_logistico", label: "Operador Logístico" },
  { value: "transporte_especializado", label: "Transporte Especializado" },
  { value: "mensajeria", label: "Mensajería" },
  { value: "almacenamiento", label: "Almacenamiento" },
  { value: "distribucion", label: "Distribución" },
  { value: "carga_pesada", label: "Carga Pesada" },
  { value: "mudanzas", label: "Mudanzas" },
  { value: "otro", label: "Otro" },
] as const;

// ============================================================================
// PROVIDER INTERFACE
// ============================================================================

export interface Provider {
  id: number;
  operatorId: number;
  businessName: string; // razón social
  taxId?: string | null; // RUT
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  businessType?: string | null; // tipo de servicio
  serviceTypes?: string | null; // servicios que ofrece (separados por coma)
  fleetSize?: number | null; // tamaño de flota
  status: boolean;
  rating?: number | null; // calificación 1-5
  observations?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: number | null;
  updatedBy?: number | null;
}

// ============================================================================
// PROVIDER INPUT TYPES
// ============================================================================

export interface CreateProviderInput {
  operatorId: number;
  businessName: string;
  taxId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  businessType?: (typeof BUSINESS_TYPES)[number]["value"];
  serviceTypes?: string;
  fleetSize?: number;
  status?: boolean;
  rating?: number;
  observations?: string;
  notes?: string;
}

export interface UpdateProviderInput {
  businessName?: string;
  taxId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  businessType?: (typeof BUSINESS_TYPES)[number]["value"];
  serviceTypes?: string;
  fleetSize?: number;
  status?: boolean;
  rating?: number;
  observations?: string;
  notes?: string;
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export interface ProviderQueryParams {
  operatorId?: number;
  search?: string;
  status?: boolean;
  businessType?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginatedProviders {
  data: Provider[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface ProviderStatistics {
  totalOperations: number;
  completedOperations: number;
  inProgressOperations: number;
  scheduledOperations: number;
  cancelledOperations: number;
}

// ============================================================================
// PROVIDER OPERATIONS
// ============================================================================

export interface ProviderOperation {
  operation: {
    id: number;
    operatorId: number;
    clientId?: number | null;
    driverId?: number | null;
    vehicleId?: number | null;
    providerId?: number | null;
    routeId?: number | null;
    operationType: string;
    status: string;
    scheduledStartDate: string;
    scheduledEndDate?: string | null;
    actualStartDate?: string | null;
    actualEndDate?: string | null;
    origin: string;
    destination: string;
    cargoDescription?: string | null;
    cargoWeight?: number | null;
    cargoUnit?: string | null;
    distance?: number | null;
    estimatedCost?: number | null;
    actualCost?: number | null;
    observations?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  client: {
    id: number;
    businessName: string;
  } | null;
  driver: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  vehicle: {
    id: number;
    plateNumber: string;
    brand?: string | null;
    model?: string | null;
  } | null;
}

export interface PaginatedProviderOperations {
  data: ProviderOperation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
