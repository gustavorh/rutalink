/**
 * Client-side API - calls Next.js API routes (not backend directly)
 * This provides a clean abstraction and enables internal network communication
 */

import { toast } from "sonner";
import { extractErrorMessage } from "./error-utils";
import {
  getCreateSuccessMessage,
  getUpdateSuccessMessage,
  getDeleteSuccessMessage,
  type ResourceType,
} from "./success-messages";

import type {
  CreateClientDto,
  UpdateClientDto,
  ClientQueryDto,
  CreateDriverDto,
  UpdateDriverDto,
  DriverQueryDto,
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleQueryDto,
  CreateOperationDto,
  UpdateOperationDto,
  OperationQueryDto,
  CreateRouteDto,
  UpdateRouteDto,
  RouteQueryDto,
  CreateProviderDto,
  UpdateProviderDto,
  ProviderQueryDto,
  CreateOperatorDto,
  UpdateOperatorDto,
  OperatorQueryDto,
  RoleCreateDto,
  RoleUpdateDto,
  RoleQueryDto,
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  LoginDto,
} from "./api-types";

import type {
  Client,
  PaginatedClients,
  ClientStatistics,
  PaginatedClientOperations,
} from "@/types/clients";
import type {
  Driver,
  PaginatedDrivers,
  DriverDocument,
} from "@/types/drivers";
import type {
  Operation,
  OperationWithDetails,
  PaginatedOperations,
} from "@/types/operations";
import type { Route, PaginatedRoutes } from "@/types/routes";
import type { Provider, PaginatedProviders } from "@/types/providers";
import type { Truck, PaginatedTrucks } from "@/types/trucks";
import type { Operator, PaginatedOperators } from "@/types/operators";
import type { User, PaginatedUsers } from "@/types/users";
import type { Role, PaginatedRoles } from "@/types/roles";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ClientApi {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    successMessage?: string
  ): Promise<T> {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Include cookies
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      // Handle 401 - redirect to login (don't show toast for auth errors)
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new ApiError(
          response.status,
          error.message || `HTTP ${response.status}: ${response.statusText}`,
          error
        );
      }
      
      // Create ApiError instance
      const apiError = new ApiError(
        response.status,
        error.message || `HTTP ${response.status}: ${response.statusText}`,
        error
      );
      
      // Show toast notification for all other errors
      if (typeof window !== "undefined") {
        const errorMessage = extractErrorMessage(apiError);
        toast.error("Error", {
          description: errorMessage,
          duration: 5000,
        });
      }
      
      throw apiError;
    }

    const data = await response.json();
    
    // Show success notification if provided
    if (successMessage && typeof window !== "undefined") {
      toast.success("Éxito", {
        description: successMessage,
        duration: 3000,
      });
    }

    return data;
  }

  // Auth
  auth = {
    login: (data: LoginDto) =>
      this.request<{ user: any; message: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    register: (data: any) =>
      this.request<{ user: any; message: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    logout: () =>
      this.request<{ message: string }>("/auth/logout", {
        method: "POST",
      }),
    me: () => this.request<{ user: any }>("/auth/me"),
  };

  // Clients
  clients = {
    list: (params?: ClientQueryDto) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const queryString = queryParams.toString();
      return this.request<PaginatedClients>(
        `/clients${queryString ? `?${queryString}` : ""}`
      );
    },
    get: (id: number) =>
      this.request<Client>(`/clients/${id}`),
    create: (data: CreateClientDto) =>
      this.request<Client>(
        "/clients",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        getCreateSuccessMessage("client")
      ),
    update: (id: number, data: UpdateClientDto) =>
      this.request<Client>(
        `/clients/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
        getUpdateSuccessMessage("client")
      ),
    delete: (id: number) =>
      this.request<{ message: string }>(
        `/clients/${id}`,
        {
          method: "DELETE",
        },
        getDeleteSuccessMessage("client")
      ),
    getOperations: (id: number, params?: any) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const queryString = queryParams.toString();
      return this.request<PaginatedClientOperations>(
        `/clients/${id}/operations${queryString ? `?${queryString}` : ""}`
      );
    },
    getStatistics: (id: number) =>
      this.request<ClientStatistics>(`/clients/${id}/statistics`),
  };

  // Drivers
  drivers = {
    list: (params?: DriverQueryDto) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const queryString = queryParams.toString();
      return this.request<PaginatedDrivers>(
        `/drivers${queryString ? `?${queryString}` : ""}`
      );
    },
    get: (id: number) =>
      this.request<Driver>(`/drivers/${id}`),
    create: (data: CreateDriverDto) =>
      this.request<Driver>(
        "/drivers",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        getCreateSuccessMessage("driver")
      ),
    update: (id: number, data: UpdateDriverDto) =>
      this.request<Driver>(
        `/drivers/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
        getUpdateSuccessMessage("driver")
      ),
    delete: (id: number) =>
      this.request<{ message: string }>(
        `/drivers/${id}`,
        {
          method: "DELETE",
        },
        getDeleteSuccessMessage("driver")
      ),
  };

  // Vehicles/Trucks
  vehicles = {
    list: (params?: VehicleQueryDto) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const queryString = queryParams.toString();
      return this.request<PaginatedTrucks>(
        `/vehicles${queryString ? `?${queryString}` : ""}`
      );
    },
    get: (id: number) =>
      this.request<Truck>(`/vehicles/${id}`),
    create: (data: CreateVehicleDto) =>
      this.request<Truck>(
        "/vehicles",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        getCreateSuccessMessage("vehicle")
      ),
    update: (id: number, data: UpdateVehicleDto) =>
      this.request<Truck>(
        `/vehicles/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
        getUpdateSuccessMessage("vehicle")
      ),
    delete: (id: number) =>
      this.request<{ message: string }>(
        `/vehicles/${id}`,
        {
          method: "DELETE",
        },
        getDeleteSuccessMessage("vehicle")
      ),
  };

  // Operations
  operations = {
    list: (params?: OperationQueryDto) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const queryString = queryParams.toString();
      return this.request<PaginatedOperations>(
        `/operations${queryString ? `?${queryString}` : ""}`
      );
    },
    get: (id: number) =>
      this.request<OperationWithDetails>(`/operations/${id}`),
    create: (data: CreateOperationDto) =>
      this.request<OperationWithDetails>(
        "/operations",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        getCreateSuccessMessage("operation")
      ),
    update: (id: number, data: UpdateOperationDto) =>
      this.request<OperationWithDetails>(
        `/operations/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
        getUpdateSuccessMessage("operation")
      ),
    delete: (id: number) =>
      this.request<{ message: string }>(
        `/operations/${id}`,
        {
          method: "DELETE",
        },
        getDeleteSuccessMessage("operation")
      ),
    generateReport: async (id: number, options?: any): Promise<Blob> => {
      const response = await fetch(`/api/operations/${id}/generate-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(options || {}),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const apiError = new ApiError(
          response.status,
          error.message || "Error generating report",
          error
        );
        
        // Show toast notification
        if (typeof window !== "undefined") {
          const errorMessage = extractErrorMessage(apiError);
          toast.error("Error", {
            description: errorMessage,
            duration: 5000,
          });
        }
        
        throw apiError;
      }

      return response.blob();
    },
  };

  // Routes
  routes = {
    list: (params?: RouteQueryDto) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const queryString = queryParams.toString();
      return this.request<PaginatedRoutes>(
        `/routes${queryString ? `?${queryString}` : ""}`
      );
    },
    get: (id: number) =>
      this.request<Route>(`/routes/${id}`),
    create: (data: CreateRouteDto) =>
      this.request<Route>(
        "/routes",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        getCreateSuccessMessage("route")
      ),
    update: (id: number, data: UpdateRouteDto) =>
      this.request<Route>(
        `/routes/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
        getUpdateSuccessMessage("route")
      ),
    delete: (id: number) =>
      this.request<{ message: string }>(
        `/routes/${id}`,
        {
          method: "DELETE",
        },
        getDeleteSuccessMessage("route")
      ),
    getStatistics: (id: number) =>
      this.request<any>(`/routes/${id}/statistics`),
  };

  // Providers
  providers = {
    list: (params?: ProviderQueryDto) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const queryString = queryParams.toString();
      return this.request<PaginatedProviders>(
        `/providers${queryString ? `?${queryString}` : ""}`
      );
    },
    get: (id: number) =>
      this.request<Provider>(`/providers/${id}`),
    create: (data: CreateProviderDto) =>
      this.request<Provider>(
        "/providers",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        getCreateSuccessMessage("provider")
      ),
    update: (id: number, data: UpdateProviderDto) =>
      this.request<Provider>(
        `/providers/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
        getUpdateSuccessMessage("provider")
      ),
    delete: (id: number) =>
      this.request<{ message: string }>(
        `/providers/${id}`,
        {
          method: "DELETE",
        },
        getDeleteSuccessMessage("provider")
      ),
    getStatistics: (id: number) =>
      this.request<any>(`/providers/${id}/statistics`),
  };

  // Operators
  operators = {
    list: (params?: OperatorQueryDto) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const queryString = queryParams.toString();
      return this.request<PaginatedOperators>(
        `/operators${queryString ? `?${queryString}` : ""}`
      );
    },
    get: (id: number) =>
      this.request<Operator>(`/operators/${id}`),
    create: (data: CreateOperatorDto) =>
      this.request<Operator>(
        "/operators",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        getCreateSuccessMessage("operator")
      ),
    update: (id: number, data: UpdateOperatorDto) =>
      this.request<Operator>(
        `/operators/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
        getUpdateSuccessMessage("operator")
      ),
    delete: (id: number) =>
      this.request<{ message: string }>(
        `/operators/${id}`,
        {
          method: "DELETE",
        },
        getDeleteSuccessMessage("operator")
      ),
    getStatistics: (id: number) =>
      this.request<any>(`/operators/${id}/statistics`),
  };

  // Roles
  roles = {
    list: (params?: RoleQueryDto) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const queryString = queryParams.toString();
      return this.request<PaginatedRoles>(
        `/roles${queryString ? `?${queryString}` : ""}`
      );
    },
    get: (id: number) =>
      this.request<Role>(`/roles/${id}`),
    create: (data: RoleCreateDto) =>
      this.request<Role>(
        "/roles",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        getCreateSuccessMessage("role")
      ),
    update: (id: number, data: RoleUpdateDto) =>
      this.request<Role>(
        `/roles/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
        getUpdateSuccessMessage("role")
      ),
    delete: (id: number) =>
      this.request<{ message: string }>(
        `/roles/${id}`,
        {
          method: "DELETE",
        },
        getDeleteSuccessMessage("role")
      ),
  };

  // Users
  users = {
    list: (params?: UserQueryDto) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const queryString = queryParams.toString();
      return this.request<PaginatedUsers>(
        `/users${queryString ? `?${queryString}` : ""}`
      );
    },
    get: (id: number) =>
      this.request<User>(`/users/${id}`),
    create: (data: CreateUserDto) =>
      this.request<User>(
        "/users",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
        getCreateSuccessMessage("user")
      ),
    update: (id: number, data: UpdateUserDto) =>
      this.request<User>(
        `/users/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
        getUpdateSuccessMessage("user")
      ),
    delete: (id: number) =>
      this.request<{ message: string }>(
        `/users/${id}`,
        {
          method: "DELETE",
        },
        getDeleteSuccessMessage("user")
      ),
  };
}

export const api = new ClientApi();

