/**
 * API Client for Backend Communication
 * Typed with backend DTOs and schemas
 */

import type {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserActivityQueryDto,
  CreateClientDto,
  UpdateClientDto,
  ClientQueryDto,
  ClientOperationsQueryDto,
  CreateDriverDto,
  UpdateDriverDto,
  DriverQueryDto,
  CreateDriverDocumentDto,
  UpdateDriverDocumentDto,
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleQueryDto,
  CreateVehicleDocumentDto,
  UpdateVehicleDocumentDto,
  UpdateOperationalStatusDto,
  CreateOperationDto,
  UpdateOperationDto,
  OperationQueryDto,
  AssignDriverToVehicleDto,
  UnassignDriverFromVehicleDto,
  GenerateReportDto,
  CreateRouteDto,
  UpdateRouteDto,
  RouteQueryDto,
  CreateOperatorDto,
  UpdateOperatorDto,
  OperatorQueryDto,
  CreateProviderDto,
  UpdateProviderDto,
  ProviderQueryDto,
  RoleCreateDto,
  RoleUpdateDto,
  RoleQueryDto,
  AssignTransportProviderDto,
  ConfirmTransportAssignmentDto,
  CreateTransportOrderDto,
  PaginatedResponse,
  DeleteResponse,
  DeleteRouteResponse,
  UserActivityResponse,
} from "./api-types";

// Import response types from @/types
import type {
  Client,
  PaginatedClients,
  ClientStatistics,
  PaginatedClientOperations,
  ClientOperation,
  IndustryAnalytics,
  TopClient,
} from "@/types/clients";

import type {
  Driver,
  PaginatedDrivers,
  DriverDocument,
  DriverVehicleAssignmentWithVehicle,
  DriverStatistics,
  Vehicle,
  PaginatedVehicles,
} from "@/types/drivers";

import type {
  Operation,
  OperationWithDetails,
  PaginatedOperations,
  OperationStatistics,
  DaySchedule,
  WeekSchedule,
  MonthSchedule,
  TransportAssignment,
  TransportOrder,
} from "@/types/operations";

import type { Route, PaginatedRoutes, RouteStatistics } from "@/types/routes";

import type {
  Provider,
  PaginatedProviders,
  ProviderStatistics,
  PaginatedProviderOperations,
} from "@/types/providers";

import type {
  Truck,
  PaginatedTrucks,
  TruckDocument,
  TruckOperation,
  TruckStatistics,
} from "@/types/trucks";

import type {
  Operator,
  PaginatedOperators,
  OperatorStatistics,
} from "@/types/operators";

import type {
  User,
  PaginatedUsers,
  UserWithStats,
  UserActivity,
} from "@/types/users";

import type { Role, PaginatedRoles } from "@/types/roles";
import type { ApiErrorResponse } from "./api-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: ApiErrorResponse
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Make an API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, "Network error. Please check your connection.");
  }
}

/**
 * Login user
 */
export async function login(credentials: LoginDto): Promise<AuthResponseDto> {
  return apiRequest<AuthResponseDto>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

/**
 * Register user
 */
export async function register(
  userData: RegisterDto
): Promise<AuthResponseDto> {
  return apiRequest<AuthResponseDto>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

/**
 * Make authenticated request
 */
export async function authenticatedRequest<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    return await apiRequest<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    // Handle session expiration - redirect to login
    if (error instanceof ApiError && error.status === 401) {
      // Only redirect if we're in the browser
      if (typeof window !== "undefined") {
        // Dynamic import to avoid circular dependency
        const { clearAuth } = await import("./auth");
        clearAuth();
        window.location.href = "/login";
      }
    }
    throw error;
  }
}

// ============================================================================
// DRIVERS API
// ============================================================================

/**
 * Get all drivers with filtering and pagination
 */
export async function getDrivers(
  token: string,
  params?: DriverQueryDto
): Promise<PaginatedDrivers> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<PaginatedDrivers>(
    `/api/drivers${queryString ? `?${queryString}` : ""}`,
    token
  );
}

/**
 * Get a single driver by ID
 */
export async function getDriverById(
  token: string,
  id: number
): Promise<Driver> {
  return authenticatedRequest<Driver>(`/api/drivers/${id}`, token);
}

/**
 * Create a new driver
 */
export async function createDriver(
  token: string,
  data: CreateDriverDto
): Promise<Driver> {
  return authenticatedRequest<Driver>("/api/drivers", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing driver
 */
export async function updateDriver(
  token: string,
  id: number,
  data: UpdateDriverDto
): Promise<Driver> {
  return authenticatedRequest<Driver>(`/api/drivers/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a driver
 */
export async function deleteDriver(
  token: string,
  id: number
): Promise<DeleteResponse> {
  return authenticatedRequest<DeleteResponse>(`/api/drivers/${id}`, token, {
    method: "DELETE",
  });
}

// ============================================================================
// DRIVER DOCUMENTS API
// ============================================================================

/**
 * Get all documents for a driver
 */
export async function getDriverDocuments(
  token: string,
  driverId: number
): Promise<DriverDocument[]> {
  return authenticatedRequest<DriverDocument[]>(
    `/api/drivers/${driverId}/documents`,
    token
  );
}

/**
 * Get a single driver document by ID
 */
export async function getDriverDocumentById(
  token: string,
  documentId: number
): Promise<DriverDocument> {
  return authenticatedRequest<DriverDocument>(
    `/api/drivers/documents/${documentId}`,
    token
  );
}

/**
 * Create a new driver document
 */
export async function createDriverDocument(
  token: string,
  driverId: number,
  data: CreateDriverDocumentDto
): Promise<DriverDocument> {
  return authenticatedRequest<DriverDocument>(
    `/api/drivers/${driverId}/documents`,
    token,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Update an existing driver document
 */
export async function updateDriverDocument(
  token: string,
  documentId: number,
  data: UpdateDriverDocumentDto
): Promise<DriverDocument> {
  return authenticatedRequest<DriverDocument>(
    `/api/drivers/documents/${documentId}`,
    token,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete a driver document
 */
export async function deleteDriverDocument(
  token: string,
  documentId: number
): Promise<DeleteResponse> {
  return authenticatedRequest<DeleteResponse>(
    `/api/drivers/documents/${documentId}`,
    token,
    {
      method: "DELETE",
    }
  );
}

// ============================================================================
// DRIVER ASSIGNMENTS API
// ============================================================================

/**
 * Assign a driver to a vehicle
 */
export async function assignDriverToVehicle(
  token: string,
  data: AssignDriverToVehicleDto
): Promise<DriverVehicleAssignmentWithVehicle> {
  return authenticatedRequest<DriverVehicleAssignmentWithVehicle>(
    `/api/operations/assignments`,
    token,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Unassign a driver from a vehicle
 */
export async function unassignDriverFromVehicle(
  token: string,
  assignmentId: number,
  data?: UnassignDriverFromVehicleDto
): Promise<DriverVehicleAssignmentWithVehicle> {
  return authenticatedRequest<DriverVehicleAssignmentWithVehicle>(
    `/api/operations/assignments/${assignmentId}/unassign`,
    token,
    {
      method: "PUT",
      body: JSON.stringify(data || {}),
    }
  );
}

/**
 * Get all vehicle assignments for a driver
 */
export async function getDriverVehicleAssignments(
  token: string,
  driverId: number
): Promise<DriverVehicleAssignmentWithVehicle[]> {
  return authenticatedRequest<DriverVehicleAssignmentWithVehicle[]>(
    `/api/operations/assignments/driver/${driverId}`,
    token
  );
}

/**
 * Get active vehicle assignment for a driver
 */
export async function getActiveDriverVehicleAssignment(
  token: string,
  driverId: number
): Promise<DriverVehicleAssignmentWithVehicle | null> {
  return authenticatedRequest<DriverVehicleAssignmentWithVehicle | null>(
    `/api/operations/assignments/driver/${driverId}/active`,
    token
  );
}

// ============================================================================
// DRIVER HISTORY & STATISTICS API
// ============================================================================

/**
 * Get operation history for a driver
 */
export async function getDriverOperations(
  token: string,
  driverId: number,
  params?: OperationQueryDto
): Promise<PaginatedOperations> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<PaginatedOperations>(
    `/api/operations/driver/${driverId}/history${
      queryString ? `?${queryString}` : ""
    }`,
    token
  );
}

/**
 * Get statistics for a driver
 */
export async function getDriverStatistics(
  token: string,
  driverId: number
): Promise<DriverStatistics> {
  return authenticatedRequest<DriverStatistics>(
    `/api/operations/driver/${driverId}/statistics`,
    token
  );
}

// ============================================================================
// VEHICLES API
// ============================================================================

/**
 * Get all vehicles with filtering and pagination
 */
export async function getVehicles(
  token: string,
  params?: VehicleQueryDto
): Promise<PaginatedVehicles> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<PaginatedVehicles>(
    `/api/vehicles${queryString ? `?${queryString}` : ""}`,
    token
  );
}

/**
 * Get a single vehicle by ID
 */
export async function getVehicleById(
  token: string,
  id: number
): Promise<Vehicle> {
  return authenticatedRequest<Vehicle>(`/api/vehicles/${id}`, token);
}

/**
 * Create a new vehicle
 */
export async function createVehicle(
  token: string,
  data: CreateVehicleDto
): Promise<Vehicle> {
  return authenticatedRequest<Vehicle>("/api/vehicles", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing vehicle
 */
export async function updateVehicle(
  token: string,
  id: number,
  data: UpdateVehicleDto
): Promise<Vehicle> {
  return authenticatedRequest<Vehicle>(`/api/vehicles/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(
  token: string,
  id: number
): Promise<DeleteResponse> {
  return authenticatedRequest<DeleteResponse>(`/api/vehicles/${id}`, token, {
    method: "DELETE",
  });
}

// ============================================================================
// OPERATIONS API
// ============================================================================

/**
 * Get all operations with filtering and pagination
 */
export async function getOperations(
  token: string,
  params?: OperationQueryDto
): Promise<PaginatedOperations> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<PaginatedOperations>(
    `/api/operations${queryString ? `?${queryString}` : ""}`,
    token
  );
}

/**
 * Get a single operation by ID
 */
export async function getOperationById(
  token: string,
  id: number
): Promise<OperationWithDetails> {
  return authenticatedRequest<OperationWithDetails>(
    `/api/operations/${id}`,
    token
  );
}

/**
 * Create a new operation
 */
export async function createOperation(
  token: string,
  data: CreateOperationDto
): Promise<OperationWithDetails> {
  return authenticatedRequest<OperationWithDetails>("/api/operations", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing operation
 */
export async function updateOperation(
  token: string,
  id: number,
  data: UpdateOperationDto
): Promise<OperationWithDetails> {
  return authenticatedRequest<OperationWithDetails>(
    `/api/operations/${id}`,
    token,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete an operation
 */
export async function deleteOperation(
  token: string,
  id: number
): Promise<DeleteResponse> {
  return authenticatedRequest<DeleteResponse>(`/api/operations/${id}`, token, {
    method: "DELETE",
  });
}

/**
 * Generate PDF report for an operation
 */
export async function generateOperationReport(
  token: string,
  id: number,
  options?: GenerateReportDto
): Promise<Blob> {
  const response = await fetch(
    `${API_BASE_URL}/api/operations/${id}/generate-report`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(options || {}),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Error generating report" }));
    throw new Error(error.message || "Error generating PDF report");
  }

  return response.blob();
}

/**
 * Get operation statistics
 */
export async function getOperationStatistics(
  token: string,
  operatorId?: number,
  startDate?: string,
  endDate?: string
): Promise<OperationStatistics> {
  const queryParams = new URLSearchParams();
  if (operatorId) queryParams.append("operatorId", operatorId.toString());
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  const queryString = queryParams.toString();
  return authenticatedRequest<OperationStatistics>(
    `/api/operations/statistics${queryString ? `?${queryString}` : ""}`,
    token
  );
}

/**
 * Get day schedule
 */
export async function getDaySchedule(
  token: string,
  date: string,
  operatorId?: number
): Promise<DaySchedule> {
  const queryParams = new URLSearchParams();
  queryParams.append("date", date);
  if (operatorId) queryParams.append("operatorId", operatorId.toString());
  return authenticatedRequest<DaySchedule>(
    `/api/operations/schedule/day?${queryParams.toString()}`,
    token
  );
}

/**
 * Get week schedule
 */
export async function getWeekSchedule(
  token: string,
  weekStart: string,
  operatorId?: number
): Promise<WeekSchedule> {
  const queryParams = new URLSearchParams();
  queryParams.append("weekStart", weekStart);
  if (operatorId) queryParams.append("operatorId", operatorId.toString());
  return authenticatedRequest<WeekSchedule>(
    `/api/operations/schedule/week?${queryParams.toString()}`,
    token
  );
}

/**
 * Get month schedule
 */
export async function getMonthSchedule(
  token: string,
  month: number,
  year: number,
  operatorId?: number
): Promise<MonthSchedule> {
  const queryParams = new URLSearchParams();
  queryParams.append("month", month.toString());
  queryParams.append("year", year.toString());
  if (operatorId) queryParams.append("operatorId", operatorId.toString());
  return authenticatedRequest<MonthSchedule>(
    `/api/operations/schedule/month?${queryParams.toString()}`,
    token
  );
}

// ============================================================================
// TRANSPORT PROVIDER ASSIGNMENT API
// ============================================================================

/**
 * Assign transport provider to operation
 */
export async function assignTransportProvider(
  token: string,
  data: AssignTransportProviderDto
): Promise<TransportAssignment> {
  return authenticatedRequest<TransportAssignment>(
    "/api/operations/assignments",
    token,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Confirm transport assignment
 */
export async function confirmTransportAssignment(
  token: string,
  assignmentId: number,
  data: ConfirmTransportAssignmentDto
): Promise<TransportAssignment> {
  return authenticatedRequest<TransportAssignment>(
    `/api/operations/assignments/${assignmentId}/confirm`,
    token,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Get transport assignments for operation
 */
export async function getOperationAssignments(
  token: string,
  operationId: number
): Promise<TransportAssignment[]> {
  return authenticatedRequest<TransportAssignment[]>(
    `/api/operations/${operationId}/assignments`,
    token
  );
}

// ============================================================================
// TRANSPORT ORDERS API
// ============================================================================

/**
 * Create transport order
 */
export async function createTransportOrder(
  token: string,
  data: CreateTransportOrderDto
): Promise<TransportOrder> {
  return authenticatedRequest<TransportOrder>(
    "/api/operations/transport-orders",
    token,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Get transport order by ID
 */
export async function getTransportOrderById(
  token: string,
  orderId: number
): Promise<TransportOrder> {
  return authenticatedRequest<TransportOrder>(
    `/api/operations/transport-orders/${orderId}`,
    token
  );
}

/**
 * Get transport orders for operation
 */
export async function getOperationTransportOrders(
  token: string,
  operationId: number
): Promise<TransportOrder[]> {
  return authenticatedRequest<TransportOrder[]>(
    `/api/operations/${operationId}/transport-orders`,
    token
  );
}

// ============================================================================
// CLIENTS API
// ============================================================================

/**
 * Get all clients with filtering and pagination
 */
export async function getClients(
  token: string,
  params?: ClientQueryDto
): Promise<PaginatedClients> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<PaginatedClients>(
    `/api/clients${queryString ? `?${queryString}` : ""}`,
    token
  );
}

/**
 * Get a single client by ID
 */
export async function getClientById(
  token: string,
  id: number
): Promise<Client> {
  return authenticatedRequest<Client>(`/api/clients/${id}`, token);
}

/**
 * Create a new client
 */
export async function createClient(
  token: string,
  data: CreateClientDto
): Promise<Client> {
  return authenticatedRequest<Client>("/api/clients", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing client
 */
export async function updateClient(
  token: string,
  id: number,
  data: UpdateClientDto
): Promise<Client> {
  return authenticatedRequest<Client>(`/api/clients/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a client (soft delete)
 */
export async function deleteClient(
  token: string,
  id: number
): Promise<DeleteResponse> {
  return authenticatedRequest<DeleteResponse>(`/api/clients/${id}`, token, {
    method: "DELETE",
  });
}

/**
 * Permanently delete a client
 */
export async function permanentlyDeleteClient(
  token: string,
  id: number
): Promise<DeleteResponse> {
  return authenticatedRequest<DeleteResponse>(
    `/api/clients/${id}/permanent`,
    token,
    {
      method: "DELETE",
    }
  );
}

/**
 * Get client operations
 */
export async function getClientOperations(
  token: string,
  clientId: number,
  params?: ClientOperationsQueryDto
): Promise<PaginatedClientOperations> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<PaginatedClientOperations>(
    `/api/clients/${clientId}/operations${
      queryString ? `?${queryString}` : ""
    }`,
    token
  );
}

/**
 * Get client statistics
 */
export async function getClientStatistics(
  token: string,
  clientId: number
): Promise<ClientStatistics> {
  return authenticatedRequest<ClientStatistics>(
    `/api/clients/${clientId}/statistics`,
    token
  );
}

/**
 * Get recent client operations
 */
export async function getRecentClientOperations(
  token: string,
  clientId: number,
  limit?: number
): Promise<PaginatedClientOperations> {
  return authenticatedRequest<PaginatedClientOperations>(
    `/api/clients/${clientId}/recent-operations${
      limit ? `?limit=${limit}` : ""
    }`,
    token
  );
}

/**
 * Get clients by industry analytics
 */
export async function getClientsByIndustry(
  token: string,
  operatorId?: number
): Promise<IndustryAnalytics[]> {
  const queryParams = new URLSearchParams();
  if (operatorId) {
    queryParams.append("operatorId", operatorId.toString());
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<IndustryAnalytics[]>(
    `/api/clients/analytics/by-industry${queryString ? `?${queryString}` : ""}`,
    token
  );
}

/**
 * Get top clients by operations
 */
export async function getTopClientsByOperations(
  token: string,
  operatorId?: number,
  limit?: number
): Promise<TopClient[]> {
  const queryParams = new URLSearchParams();
  if (operatorId) {
    queryParams.append("operatorId", operatorId.toString());
  }
  if (limit) {
    queryParams.append("limit", limit.toString());
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<TopClient[]>(
    `/api/clients/analytics/top-clients${queryString ? `?${queryString}` : ""}`,
    token
  );
}

// ============================================================================
// ROUTES API
// ============================================================================

/**
 * Get all routes with filtering and pagination
 */
export async function getRoutes(
  token: string,
  params?: RouteQueryDto
): Promise<PaginatedRoutes> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<PaginatedRoutes>(
    `/api/routes${queryString ? `?${queryString}` : ""}`,
    token
  );
}

/**
 * Get a single route by ID
 */
export async function getRouteById(token: string, id: number): Promise<Route> {
  return authenticatedRequest<Route>(`/api/routes/${id}`, token);
}

/**
 * Create a new route
 */
export async function createRoute(
  token: string,
  data: CreateRouteDto
): Promise<Route> {
  return authenticatedRequest<Route>("/api/routes", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing route
 */
export async function updateRoute(
  token: string,
  id: number,
  data: UpdateRouteDto
): Promise<Route> {
  return authenticatedRequest<Route>(`/api/routes/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a route
 */
export async function deleteRoute(
  token: string,
  id: number
): Promise<DeleteRouteResponse> {
  return authenticatedRequest<DeleteRouteResponse>(`/api/routes/${id}`, token, {
    method: "DELETE",
  });
}

/**
 * Get route statistics
 */
export async function getRouteStatistics(
  token: string,
  routeId: number
): Promise<RouteStatistics> {
  return authenticatedRequest<RouteStatistics>(
    `/api/routes/${routeId}/statistics`,
    token
  );
}

// ============================================================================
// PROVIDERS API
// ============================================================================

/**
 * Get all providers with filtering and pagination
 */
export async function getProviders(
  token: string,
  params?: ProviderQueryDto
): Promise<PaginatedProviders> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<PaginatedProviders>(
    `/api/providers${queryString ? `?${queryString}` : ""}`,
    token
  );
}

/**
 * Get a single provider by ID
 */
export async function getProviderById(
  token: string,
  id: number
): Promise<Provider> {
  return authenticatedRequest<Provider>(`/api/providers/${id}`, token);
}

/**
 * Create a new provider
 */
export async function createProvider(
  token: string,
  data: CreateProviderDto
): Promise<Provider> {
  return authenticatedRequest<Provider>("/api/providers", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing provider
 */
export async function updateProvider(
  token: string,
  id: number,
  data: UpdateProviderDto
): Promise<Provider> {
  return authenticatedRequest<Provider>(`/api/providers/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a provider
 */
export async function deleteProvider(
  token: string,
  id: number
): Promise<DeleteResponse> {
  return authenticatedRequest<DeleteResponse>(`/api/providers/${id}`, token, {
    method: "DELETE",
  });
}

/**
 * Get provider statistics
 */
export async function getProviderStatistics(
  token: string,
  providerId: number
): Promise<ProviderStatistics> {
  return authenticatedRequest<ProviderStatistics>(
    `/api/providers/${providerId}/statistics`,
    token
  );
}

/**
 * Get provider operations
 */
export async function getProviderOperations(
  token: string,
  providerId: number,
  page?: number,
  limit?: number
): Promise<PaginatedProviderOperations> {
  const queryParams = new URLSearchParams();
  if (page) queryParams.append("page", page.toString());
  if (limit) queryParams.append("limit", limit.toString());
  const queryString = queryParams.toString();
  return authenticatedRequest<PaginatedProviderOperations>(
    `/api/providers/${providerId}/operations${
      queryString ? `?${queryString}` : ""
    }`,
    token
  );
}

// ============================================================================
// TRUCKS API (aliases for vehicles)
// ============================================================================

/**
 * Get all trucks with filtering and pagination
 * @deprecated Use getVehicles instead
 */
export async function getTrucks(
  token: string,
  params?: VehicleQueryDto
): Promise<PaginatedTrucks> {
  const result = await getVehicles(token, params);
  // Truck and Vehicle types are compatible, but we need to ensure proper typing
  return result as unknown as PaginatedTrucks;
}

/**
 * Get a single truck by ID
 * @deprecated Use getVehicleById instead
 */
export async function getTruckById(token: string, id: number): Promise<Truck> {
  const result = await getVehicleById(token, id);
  // Truck and Vehicle types are compatible, but we need to ensure proper typing
  return result as unknown as Truck;
}

/**
 * Create a new truck
 * @deprecated Use createVehicle instead
 */
export async function createTruck(
  token: string,
  data: CreateVehicleDto
): Promise<Truck> {
  const result = await createVehicle(token, data);
  // Truck and Vehicle types are compatible, but we need to ensure proper typing
  return result as unknown as Truck;
}

/**
 * Update an existing truck
 * @deprecated Use updateVehicle instead
 */
export async function updateTruck(
  token: string,
  id: number,
  data: UpdateVehicleDto
): Promise<Truck> {
  const result = await updateVehicle(token, id, data);
  // Truck and Vehicle types are compatible, but we need to ensure proper typing
  return result as unknown as Truck;
}

/**
 * Delete a truck
 * @deprecated Use deleteVehicle instead
 */
export async function deleteTruck(
  token: string,
  id: number
): Promise<DeleteResponse> {
  return deleteVehicle(token, id);
}

// ============================================================================
// TRUCK DOCUMENTS API
// ============================================================================

/**
 * Get all documents for a truck
 */
export async function getTruckDocuments(
  token: string,
  truckId: number
): Promise<TruckDocument[]> {
  return authenticatedRequest<TruckDocument[]>(
    `/api/vehicles/${truckId}/documents`,
    token
  );
}

/**
 * Create a new truck document
 */
export async function createTruckDocument(
  token: string,
  data: CreateVehicleDocumentDto
): Promise<TruckDocument> {
  return authenticatedRequest<TruckDocument>("/api/vehicles/documents", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing truck document
 */
export async function updateTruckDocument(
  token: string,
  documentId: number,
  data: UpdateVehicleDocumentDto
): Promise<TruckDocument> {
  return authenticatedRequest<TruckDocument>(
    `/api/vehicles/documents/${documentId}`,
    token,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete a truck document
 */
export async function deleteTruckDocument(
  token: string,
  documentId: number
): Promise<DeleteResponse> {
  return authenticatedRequest<DeleteResponse>(
    `/api/vehicles/documents/${documentId}`,
    token,
    {
      method: "DELETE",
    }
  );
}

/**
 * Get expiring documents
 */
export async function getExpiringDocuments(
  token: string,
  days: number = 30
): Promise<TruckDocument[]> {
  return authenticatedRequest<TruckDocument[]>(
    `/api/vehicles/documents/expiring?days=${days}`,
    token
  );
}

// ============================================================================
// TRUCK OPERATIONS & HISTORY API
// ============================================================================

/**
 * Get operational status of a truck
 */
export async function getTruckOperationalStatus(
  token: string,
  truckId: number
): Promise<{ status: string; notes?: string }> {
  return authenticatedRequest<{ status: string; notes?: string }>(
    `/api/vehicles/${truckId}/operational-status`,
    token
  );
}

/**
 * Get operation history for a truck
 */
export async function getTruckOperationHistory(
  token: string,
  truckId: number,
  limit: number = 10
): Promise<TruckOperation[]> {
  return authenticatedRequest<TruckOperation[]>(
    `/api/vehicles/${truckId}/operations/history?limit=${limit}`,
    token
  );
}

/**
 * Get upcoming operations for a truck
 */
export async function getTruckUpcomingOperations(
  token: string,
  truckId: number
): Promise<TruckOperation[]> {
  return authenticatedRequest<TruckOperation[]>(
    `/api/vehicles/${truckId}/operations/upcoming`,
    token
  );
}

/**
 * Get statistics overview for all trucks
 */
export async function getTrucksStatsOverview(
  token: string
): Promise<TruckStatistics> {
  return authenticatedRequest<TruckStatistics>(
    "/api/vehicles/stats/overview",
    token
  );
}

// ==========================================
// OPERATORS API
// ==========================================

/**
 * Get all operators with filtering and pagination
 */
export async function getOperators(
  token: string,
  params?: OperatorQueryDto
): Promise<PaginatedOperators> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<PaginatedOperators>(
    `/api/operators${queryString ? `?${queryString}` : ""}`,
    token
  );
}

/**
 * Get a single operator by ID
 */
export async function getOperatorById(
  token: string,
  id: number
): Promise<Operator> {
  return authenticatedRequest<Operator>(`/api/operators/${id}`, token);
}

/**
 * Create a new operator
 */
export async function createOperator(
  token: string,
  data: CreateOperatorDto
): Promise<Operator> {
  return authenticatedRequest<Operator>("/api/operators", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing operator
 */
export async function updateOperator(
  token: string,
  id: number,
  data: UpdateOperatorDto
): Promise<Operator> {
  return authenticatedRequest<Operator>(`/api/operators/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete an operator (soft delete)
 */
export async function deleteOperator(
  token: string,
  id: number
): Promise<DeleteResponse> {
  return authenticatedRequest<DeleteResponse>(`/api/operators/${id}`, token, {
    method: "DELETE",
  });
}

/**
 * Get operator statistics
 */
export async function getOperatorStatistics(
  token: string,
  id: number
): Promise<OperatorStatistics> {
  return authenticatedRequest<OperatorStatistics>(
    `/api/operators/${id}/statistics`,
    token
  );
}

// ==========================================
// ROLES API
// ==========================================

/**
 * Get all roles with filtering and pagination
 */
export async function getRoles(
  token: string,
  params?: RoleQueryDto
): Promise<PaginatedRoles> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<PaginatedRoles>(
    `/api/roles${queryString ? `?${queryString}` : ""}`,
    token
  );
}

/**
 * Get a single role by ID
 */
export async function getRoleById(token: string, id: number): Promise<Role> {
  return authenticatedRequest<Role>(`/api/roles/${id}`, token);
}

/**
 * Create a new role
 */
export async function createRole(
  token: string,
  data: RoleCreateDto
): Promise<Role> {
  return authenticatedRequest<Role>("/api/roles", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing role
 */
export async function updateRole(
  token: string,
  id: number,
  data: RoleUpdateDto
): Promise<Role> {
  return authenticatedRequest<Role>(`/api/roles/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a role
 */
export async function deleteRole(
  token: string,
  id: number
): Promise<DeleteResponse> {
  return authenticatedRequest<DeleteResponse>(`/api/roles/${id}`, token, {
    method: "DELETE",
  });
}

// ==========================================
// USERS API
// ==========================================

/**
 * Get all users with filtering and pagination
 */
export async function getUsers(
  token: string,
  params?: UserQueryDto
): Promise<PaginatedUsers> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<PaginatedUsers>(
    `/api/users${queryString ? `?${queryString}` : ""}`,
    token
  );
}

/**
 * Get a single user by ID
 */
export async function getUserById(token: string, id: number): Promise<User> {
  return authenticatedRequest<User>(`/api/users/${id}`, token);
}

/**
 * Get a user with statistics
 */
export async function getUserWithStats(
  token: string,
  id: number
): Promise<UserWithStats> {
  return authenticatedRequest<UserWithStats>(`/api/users/${id}/stats`, token);
}

/**
 * Create a new user
 */
export async function createUser(
  token: string,
  data: CreateUserDto
): Promise<User> {
  return authenticatedRequest<User>("/api/users", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing user
 */
export async function updateUser(
  token: string,
  id: number,
  data: UpdateUserDto
): Promise<User> {
  return authenticatedRequest<User>(`/api/users/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a user (soft delete)
 */
export async function deleteUser(
  token: string,
  id: number
): Promise<DeleteResponse> {
  return authenticatedRequest<DeleteResponse>(`/api/users/${id}`, token, {
    method: "DELETE",
  });
}

/**
 * Get user activity logs
 */
export async function getUserActivity(
  token: string,
  params: UserActivityQueryDto
): Promise<UserActivityResponse> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  const queryString = queryParams.toString();
  return authenticatedRequest<UserActivityResponse>(
    `/api/users/activity${queryString ? `?${queryString}` : ""}`,
    token
  );
}
