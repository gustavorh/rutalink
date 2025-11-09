/**
 * Operator Types and Interfaces
 * Multi-tenancy organization management
 */

// Operator interface
export interface Operator {
  id: number;
  name: string;
  description?: string | null;
  super: boolean;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create operator input
export interface CreateOperatorInput {
  name: string;
  description?: string;
  super?: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  status?: boolean;
}

// Update operator input
export interface UpdateOperatorInput {
  name?: string;
  description?: string;
  super?: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  status?: boolean;
}

// Operator query parameters
export interface OperatorQueryParams {
  search?: string;
  status?: boolean;
  super?: boolean;
  page?: number;
  limit?: number;
}

// Paginated operators response
export interface PaginatedOperators {
  data: Operator[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Operator statistics
export interface OperatorStatistics {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  totalClients: number;
  totalOperations: number;
}
