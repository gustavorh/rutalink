/**
 * User Types and Interfaces
 * User management within operators
 */

// User status types
export const USER_STATUSES = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
  { value: "suspended", label: "Suspendido" },
  { value: "pending", label: "Pendiente" },
] as const;

export type UserStatusType = (typeof USER_STATUSES)[number]["value"];

// User interface - matches database schema
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  status: boolean;
  lastActivityAt?: string | null;
  operatorId: number;
  roleId: number;
  createdAt: string;
  updatedAt: string;
  operator?: {
    id: number;
    name: string;
    super?: boolean;
  };
  role?: {
    id: number;
    name: string;
    permissions: string[];
  };
}


// Paginated users response
export interface PaginatedUsers {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User with statistics
export interface UserWithStats extends User {
  statistics?: {
    totalOperations: number;
    completedOperations: number;
    activeOperations: number;
    loginCount: number;
  };
}

// User activity log
export interface UserActivity {
  id: number;
  userId: number;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// User activity query
export interface UserActivityQueryParams {
  userId: number;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
