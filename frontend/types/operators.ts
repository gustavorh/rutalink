/**
 * Operator Types and Interfaces
 * Multi-tenancy organization management
 */

// Operator interface - matches database schema
export interface Operator {
  id: number;
  name: string;
  rut?: string | null; // Format: 21.023.531-0
  super: boolean;
  expiration?: string | null; // Expiration date for the operator
  status: boolean;
  createdAt: string;
  updatedAt: string;
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
