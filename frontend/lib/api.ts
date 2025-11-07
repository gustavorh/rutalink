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
