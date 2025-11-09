/**
 * Role Types and Interfaces
 * Role-based access control
 */

// Permission types
export const PERMISSIONS = [
  { value: "users.read", label: "Ver Usuarios" },
  { value: "users.create", label: "Crear Usuarios" },
  { value: "users.update", label: "Actualizar Usuarios" },
  { value: "users.delete", label: "Eliminar Usuarios" },
  { value: "roles.read", label: "Ver Roles" },
  { value: "roles.create", label: "Crear Roles" },
  { value: "roles.update", label: "Actualizar Roles" },
  { value: "roles.delete", label: "Eliminar Roles" },
  { value: "clients.read", label: "Ver Clientes" },
  { value: "clients.create", label: "Crear Clientes" },
  { value: "clients.update", label: "Actualizar Clientes" },
  { value: "clients.delete", label: "Eliminar Clientes" },
  { value: "drivers.read", label: "Ver Choferes" },
  { value: "drivers.create", label: "Crear Choferes" },
  { value: "drivers.update", label: "Actualizar Choferes" },
  { value: "drivers.delete", label: "Eliminar Choferes" },
  { value: "vehicles.read", label: "Ver Vehículos" },
  { value: "vehicles.create", label: "Crear Vehículos" },
  { value: "vehicles.update", label: "Actualizar Vehículos" },
  { value: "vehicles.delete", label: "Eliminar Vehículos" },
  { value: "operations.read", label: "Ver Operaciones" },
  { value: "operations.create", label: "Crear Operaciones" },
  { value: "operations.update", label: "Actualizar Operaciones" },
  { value: "operations.delete", label: "Eliminar Operaciones" },
  { value: "routes.read", label: "Ver Rutas" },
  { value: "routes.create", label: "Crear Rutas" },
  { value: "routes.update", label: "Actualizar Rutas" },
  { value: "routes.delete", label: "Eliminar Rutas" },
  { value: "providers.read", label: "Ver Proveedores" },
  { value: "providers.create", label: "Crear Proveedores" },
  { value: "providers.update", label: "Actualizar Proveedores" },
  { value: "providers.delete", label: "Eliminar Proveedores" },
  { value: "reports.read", label: "Ver Reportes" },
  { value: "reports.create", label: "Crear Reportes" },
  { value: "analytics.read", label: "Ver Analíticas" },
] as const;

export type PermissionType = (typeof PERMISSIONS)[number]["value"];

// Role interface
export interface Role {
  id: number;
  operatorId: number;
  name: string;
  description?: string | null;
  permissions: string[];
  isSystemRole: boolean;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  operator?: {
    id: number;
    name: string;
  };
  userCount?: number;
}

// Create role input
export interface CreateRoleInput {
  operatorId: number;
  name: string;
  description?: string;
  permissions: string[];
  status?: boolean;
}

// Update role input
export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
  status?: boolean;
}

// Role query parameters
export interface RoleQueryParams {
  operatorId?: number;
  search?: string;
  status?: boolean;
  isSystemRole?: boolean;
  page?: number;
  limit?: number;
}

// Paginated roles response
export interface PaginatedRoles {
  data: Role[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Permission group for UI organization
export interface PermissionGroup {
  category: string;
  permissions: {
    value: string;
    label: string;
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  }[];
}
