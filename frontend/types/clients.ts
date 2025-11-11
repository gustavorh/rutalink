/**
 * Client Types and Interfaces
 */

// Industry types based on schema
export const INDUSTRIES = [
  { value: "minería", label: "Minería" },
  { value: "construcción", label: "Construcción" },
  { value: "industrial", label: "Industrial" },
  { value: "agricultura", label: "Agricultura" },
  { value: "transporte", label: "Transporte" },
  { value: "energía", label: "Energía" },
  { value: "forestal", label: "Forestal" },
  { value: "pesca", label: "Pesca" },
  { value: "retail", label: "Retail" },
  { value: "servicios", label: "Servicios" },
  { value: "manufactura", label: "Manufactura" },
  { value: "tecnología", label: "Tecnología" },
  { value: "otro", label: "Otro" },
] as const;

export type IndustryType = (typeof INDUSTRIES)[number]["value"];

// Client interface
export interface Client {
  id: number;
  operatorId: number;
  businessName: string;
  taxId?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  industry?: string | null;
  status: boolean;
  observations?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: number | null;
  updatedBy?: number | null;
}


// Paginated clients response
export interface PaginatedClients {
  data: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Client operation
export interface ClientOperation {
  id: number;
  operationNumber: string;
  operationType: string;
  origin: string;
  destination: string;
  scheduledStartDate: string;
  scheduledEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  status: string;
  cargoDescription?: string | null;
  cargoWeight?: number | null;
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  vehicle?: {
    id: number;
    plateNumber: string;
    brand?: string;
    model?: string;
  };
}

// Client statistics
export interface ClientStatistics {
  totalOperations: number;
  completedOperations: number;
  inProgressOperations: number;
  scheduledOperations: number;
  cancelledOperations: number;
  totalCargoWeight?: number;
  averageOperationDuration?: number;
}

// Client operations query
export interface ClientOperationsQueryParams {
  status?: string;
  operationType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Paginated client operations
export interface PaginatedClientOperations {
  data: ClientOperation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Industry analytics
export interface IndustryAnalytics {
  industry: string;
  clientCount: number;
  percentage: number;
}

// Top client by operations
export interface TopClient {
  client: Client;
  operationCount: number;
  completedOperations: number;
  inProgressOperations: number;
}
