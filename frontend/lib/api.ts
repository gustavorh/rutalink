/**
 * API Client for Backend Communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  operatorId: number;
  roleId: number;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    operatorId: number;
    roleId: number;
    operator?: {
      id: number;
      name: string;
      super: boolean;
    };
    role?: {
      id: number;
      name: string;
    };
  };
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
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
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

/**
 * Register user
 */
export async function register(
  userData: RegisterRequest
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/register", {
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
  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

// ============================================================================
// DRIVERS API
// ============================================================================

import type {
  Driver,
  CreateDriverInput,
  UpdateDriverInput,
  DriverQueryParams,
  PaginatedDrivers,
  DriverDocument,
  CreateDriverDocumentInput,
  UpdateDriverDocumentInput,
  DriverVehicleAssignmentWithVehicle,
  AssignDriverToVehicleInput,
  UnassignDriverFromVehicleInput,
  DriverStatistics,
  Vehicle,
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleQueryParams,
  PaginatedVehicles,
  OperationWithDetails,
  CreateOperationInput,
  UpdateOperationInput,
  OperationQueryParams,
  PaginatedOperations,
} from "@/types/drivers";

/**
 * Get all drivers with filtering and pagination
 */
export async function getDrivers(
  token: string,
  params?: DriverQueryParams
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
  data: CreateDriverInput
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
  data: UpdateDriverInput
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
): Promise<{ message: string }> {
  return authenticatedRequest<{ message: string }>(
    `/api/drivers/${id}`,
    token,
    {
      method: "DELETE",
    }
  );
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
  data: CreateDriverDocumentInput
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
  data: UpdateDriverDocumentInput
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
): Promise<{ message: string }> {
  return authenticatedRequest<{ message: string }>(
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
  driverId: number,
  data: AssignDriverToVehicleInput
): Promise<DriverVehicleAssignmentWithVehicle> {
  return authenticatedRequest<DriverVehicleAssignmentWithVehicle>(
    `/api/drivers/${driverId}/assign-vehicle`,
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
  data?: UnassignDriverFromVehicleInput
): Promise<DriverVehicleAssignmentWithVehicle> {
  return authenticatedRequest<DriverVehicleAssignmentWithVehicle>(
    `/api/drivers/assignments/${assignmentId}/unassign`,
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
    `/api/drivers/${driverId}/assignments`,
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
    `/api/drivers/${driverId}/active-assignment`,
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
  params?: OperationQueryParams
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
    `/api/drivers/${driverId}/operations${
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
    `/api/drivers/${driverId}/statistics`,
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
  params?: VehicleQueryParams
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
    `/api/drivers/vehicles${queryString ? `?${queryString}` : ""}`,
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
  return authenticatedRequest<Vehicle>(`/api/drivers/vehicles/${id}`, token);
}

/**
 * Create a new vehicle
 */
export async function createVehicle(
  token: string,
  data: CreateVehicleInput
): Promise<Vehicle> {
  return authenticatedRequest<Vehicle>("/api/drivers/vehicles", token, {
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
  data: UpdateVehicleInput
): Promise<Vehicle> {
  return authenticatedRequest<Vehicle>(`/api/drivers/vehicles/${id}`, token, {
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
): Promise<{ message: string }> {
  return authenticatedRequest<{ message: string }>(
    `/api/drivers/vehicles/${id}`,
    token,
    {
      method: "DELETE",
    }
  );
}

// ============================================================================
// OPERATIONS API
// ============================================================================

/**
 * Get all operations with filtering and pagination
 */
export async function getOperations(
  token: string,
  params?: OperationQueryParams
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
    `/api/drivers/operations${queryString ? `?${queryString}` : ""}`,
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
    `/api/drivers/operations/${id}`,
    token
  );
}

/**
 * Create a new operation
 */
export async function createOperation(
  token: string,
  data: CreateOperationInput
): Promise<OperationWithDetails> {
  return authenticatedRequest<OperationWithDetails>(
    "/api/drivers/operations",
    token,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Update an existing operation
 */
export async function updateOperation(
  token: string,
  id: number,
  data: UpdateOperationInput
): Promise<OperationWithDetails> {
  return authenticatedRequest<OperationWithDetails>(
    `/api/drivers/operations/${id}`,
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
): Promise<{ message: string }> {
  return authenticatedRequest<{ message: string }>(
    `/api/drivers/operations/${id}`,
    token,
    {
      method: "DELETE",
    }
  );
}

// ============================================================================
// CLIENTS API
// ============================================================================

import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  ClientQueryParams,
  PaginatedClients,
  ClientStatistics,
  ClientOperationsQueryParams,
  PaginatedClientOperations,
  IndustryAnalytics,
  TopClient,
} from "@/types/clients";

/**
 * Get all clients with filtering and pagination
 */
export async function getClients(
  token: string,
  params?: ClientQueryParams
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
  data: CreateClientInput
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
  data: UpdateClientInput
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
): Promise<{ message: string }> {
  return authenticatedRequest<{ message: string }>(
    `/api/clients/${id}`,
    token,
    {
      method: "DELETE",
    }
  );
}

/**
 * Permanently delete a client
 */
export async function permanentlyDeleteClient(
  token: string,
  id: number
): Promise<{ message: string }> {
  return authenticatedRequest<{ message: string }>(
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
  params?: ClientOperationsQueryParams
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

import type {
  Route,
  CreateRouteInput,
  UpdateRouteInput,
  RouteQueryParams,
  PaginatedRoutes,
  RouteStatistics,
} from "@/types/routes";

/**
 * Get all routes with filtering and pagination
 */
export async function getRoutes(
  token: string,
  params?: RouteQueryParams
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
  data: CreateRouteInput
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
  data: UpdateRouteInput
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
): Promise<{ message: string; route: Route }> {
  return authenticatedRequest<{ message: string; route: Route }>(
    `/api/routes/${id}`,
    token,
    {
      method: "DELETE",
    }
  );
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

import type {
  Provider,
  CreateProviderInput,
  UpdateProviderInput,
  ProviderQueryParams,
  PaginatedProviders,
  ProviderStatistics,
  PaginatedProviderOperations,
} from "@/types/providers";

/**
 * Get all providers with filtering and pagination
 */
export async function getProviders(
  token: string,
  params?: ProviderQueryParams
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
  data: CreateProviderInput
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
  data: UpdateProviderInput
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
): Promise<{ message: string }> {
  return authenticatedRequest<{ message: string }>(
    `/api/providers/${id}`,
    token,
    {
      method: "DELETE",
    }
  );
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
// TRUCKS API
// ============================================================================

import type {
  Truck,
  CreateTruckInput,
  UpdateTruckInput,
  TruckQueryParams,
  PaginatedTrucks,
  TruckDocument,
  CreateTruckDocumentInput,
  UpdateTruckDocumentInput,
  TruckOperation,
  TruckStatistics,
} from "@/types/trucks";

/**
 * Get all trucks with filtering and pagination
 */
export async function getTrucks(
  token: string,
  params?: TruckQueryParams
): Promise<PaginatedTrucks> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const queryString = queryParams.toString();
  return authenticatedRequest<PaginatedTrucks>(
    `/api/vehicles${queryString ? `?${queryString}` : ""}`,
    token
  );
}

/**
 * Get a single truck by ID
 */
export async function getTruckById(token: string, id: number): Promise<Truck> {
  return authenticatedRequest<Truck>(`/api/vehicles/${id}`, token);
}

/**
 * Create a new truck
 */
export async function createTruck(
  token: string,
  data: CreateTruckInput
): Promise<Truck> {
  return authenticatedRequest<Truck>("/api/vehicles", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing truck
 */
export async function updateTruck(
  token: string,
  id: number,
  data: UpdateTruckInput
): Promise<Truck> {
  return authenticatedRequest<Truck>(`/api/vehicles/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a truck
 */
export async function deleteTruck(
  token: string,
  id: number
): Promise<{ message: string }> {
  return authenticatedRequest<{ message: string }>(
    `/api/vehicles/${id}`,
    token,
    {
      method: "DELETE",
    }
  );
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
  data: CreateTruckDocumentInput
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
  data: UpdateTruckDocumentInput
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
): Promise<{ message: string }> {
  return authenticatedRequest<{ message: string }>(
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
