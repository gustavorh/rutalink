/**
 * Type definitions matching backend DTOs and schemas
 * These types are derived from the backend DTO classes to ensure type safety
 */

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  operatorId: number;
  roleId: number;
}

export interface AuthResponseDto {
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

// ============================================================================
// USER TYPES
// ============================================================================

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  operatorId: number;
  roleId: number;
  status?: boolean;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: number;
  status?: boolean;
}

// ============================================================================
// CLIENT TYPES
// ============================================================================

export interface CreateClientDto {
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
  industry?:
    | "minería"
    | "construcción"
    | "industrial"
    | "agricultura"
    | "transporte"
    | "energía"
    | "forestal"
    | "pesca"
    | "retail"
    | "servicios"
    | "manufactura"
    | "tecnología"
    | "otro";
  status?: boolean;
  observations?: string;
  notes?: string;
}

export interface UpdateClientDto {
  businessName?: string;
  taxId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  industry?:
    | "minería"
    | "construcción"
    | "industrial"
    | "agricultura"
    | "transporte"
    | "energía"
    | "forestal"
    | "pesca"
    | "retail"
    | "servicios"
    | "manufactura"
    | "tecnología"
    | "otro";
  status?: boolean;
  observations?: string;
  notes?: string;
}

export interface ClientQueryDto {
  operatorId?: number;
  search?: string;
  status?: boolean;
  industry?: string;
  city?: string;
  region?: string;
  page?: number;
  limit?: number;
}

export interface ClientOperationsQueryDto {
  status?: string;
  operationType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// DRIVER TYPES
// ============================================================================

export interface CreateDriverDto {
  operatorId: number;
  rut: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  licenseType: "A1" | "A2" | "A3" | "A4" | "A5" | "B" | "C" | "D" | "E" | "F";
  licenseNumber: string;
  licenseExpirationDate: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  region?: string;
  status?: boolean;
  isExternal?: boolean;
  externalCompany?: string;
  notes?: string;
}

export interface UpdateDriverDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  licenseType?: "A1" | "A2" | "A3" | "A4" | "A5" | "B" | "C" | "D" | "E" | "F";
  licenseNumber?: string;
  licenseExpirationDate?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  region?: string;
  status?: boolean;
  isExternal?: boolean;
  externalCompany?: string;
  notes?: string;
}

export interface DriverQueryDto {
  operatorId?: number;
  search?: string;
  status?: boolean;
  isExternal?: boolean;
  licenseType?: string;
  page?: number;
  limit?: number;
}

export interface CreateDriverDocumentDto {
  driverId: number;
  documentType:
    | "license"
    | "certificate"
    | "medical"
    | "psychotechnical"
    | "training"
    | "insurance"
    | "other";
  documentName: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  issueDate?: string;
  expirationDate?: string;
  notes?: string;
}

export interface UpdateDriverDocumentDto {
  documentName?: string;
  issueDate?: string;
  expirationDate?: string;
  notes?: string;
}

// ============================================================================
// VEHICLE TYPES
// ============================================================================

export enum VehicleType {
  TRUCK = "truck",
  VAN = "van",
  PICKUP = "pickup",
  FLATBED = "flatbed",
  TRAILER = "trailer",
  DUMP_TRUCK = "dump_truck",
  CRANE_TRUCK = "crane_truck",
  OTHER = "other",
}

export enum CapacityUnit {
  KG = "kg",
  TONS = "tons",
  M3 = "m3",
  PASSENGERS = "passengers",
}

export enum OperationalStatus {
  ACTIVE = "active",
  MAINTENANCE = "maintenance",
  OUT_OF_SERVICE = "out_of_service",
  RESERVED = "reserved",
}

export enum DocumentType {
  CIRCULATION_PERMIT = "circulation_permit",
  TECHNICAL_REVIEW = "technical_review",
  INSURANCE = "insurance",
  OWNERSHIP = "ownership",
  GAS_CERTIFICATION = "gas_certification",
  OTHER = "other",
}

export interface CreateVehicleDto {
  plateNumber: string;
  brand?: string;
  model?: string;
  year?: number;
  vehicleType: VehicleType;
  capacity?: number;
  capacityUnit?: CapacityUnit;
  vin?: string;
  color?: string;
  status?: boolean;
  notes?: string;
}

export interface UpdateVehicleDto {
  plateNumber?: string;
  brand?: string;
  model?: string;
  year?: number;
  vehicleType?: VehicleType;
  capacity?: number;
  capacityUnit?: CapacityUnit;
  vin?: string;
  color?: string;
  status?: boolean;
  notes?: string;
}

export interface VehicleQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  vehicleType?: VehicleType;
  status?: boolean;
  operationalStatus?: OperationalStatus;
  includeDocuments?: boolean;
  includeStats?: boolean;
}

export interface CreateVehicleDocumentDto {
  vehicleId: number;
  documentType: DocumentType;
  documentName: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  issueDate?: string;
  expirationDate?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  coverageAmount?: number;
  notes?: string;
}

export interface UpdateVehicleDocumentDto {
  documentType?: DocumentType;
  documentName?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  issueDate?: string;
  expirationDate?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  coverageAmount?: number;
  notes?: string;
}

export interface UpdateOperationalStatusDto {
  status: OperationalStatus;
  notes?: string;
}

// ============================================================================
// OPERATION TYPES
// ============================================================================

export interface CreateOperationDto {
  operatorId: number;
  clientId?: number;
  providerId?: number;
  routeId?: number;
  driverId: number;
  vehicleId: number;
  operationNumber: string;
  operationType: string;
  origin: string;
  destination: string;
  scheduledStartDate: string;
  scheduledEndDate?: string;
  distance?: number;
  cargoDescription?: string;
  cargoWeight?: number;
  notes?: string;
}

export interface UpdateOperationDto {
  clientId?: number;
  providerId?: number;
  routeId?: number;
  driverId?: number;
  vehicleId?: number;
  operationType?: string;
  origin?: string;
  destination?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  distance?: number;
  status?: "scheduled" | "in-progress" | "completed" | "cancelled";
  cargoDescription?: string;
  cargoWeight?: number;
  notes?: string;
}

export interface OperationQueryDto {
  operatorId?: number;
  clientId?: number;
  providerId?: number;
  driverId?: number;
  vehicleId?: number;
  status?: string;
  operationType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AssignDriverToVehicleDto {
  driverId: number;
  vehicleId: number;
  notes?: string;
}

export interface UnassignDriverFromVehicleDto {
  notes?: string;
}

export interface GenerateReportDto {
  includePhotos?: boolean;
  includeTimeline?: boolean;
  includeIncidents?: boolean;
  language?: "es" | "en";
}

// ============================================================================
// ROUTE TYPES
// ============================================================================

export interface CreateRouteDto {
  name: string;
  code?: string;
  origin: string;
  destination: string;
  distance?: number;
  estimatedDuration?: number;
  routeType?:
    | "urbana"
    | "interurbana"
    | "minera"
    | "rural"
    | "carretera"
    | "montaña"
    | "otra";
  difficulty?: "fácil" | "moderada" | "difícil";
  roadConditions?: string;
  tollsRequired?: boolean;
  estimatedTollCost?: number;
  observations?: string;
  notes?: string;
}

export interface UpdateRouteDto {
  name?: string;
  code?: string;
  origin?: string;
  destination?: string;
  distance?: number;
  estimatedDuration?: number;
  routeType?:
    | "urbana"
    | "interurbana"
    | "minera"
    | "rural"
    | "carretera"
    | "montaña"
    | "otra";
  difficulty?: "fácil" | "moderada" | "difícil";
  roadConditions?: string;
  tollsRequired?: boolean;
  estimatedTollCost?: number;
  status?: boolean;
  observations?: string;
  notes?: string;
}

export interface RouteQueryDto {
  search?: string;
  routeType?:
    | "urbana"
    | "interurbana"
    | "minera"
    | "rural"
    | "carretera"
    | "montaña"
    | "otra";
  difficulty?: "fácil" | "moderada" | "difícil";
  status?: boolean;
  tollsRequired?: boolean;
  page?: number;
  limit?: number;
}

// ============================================================================
// OPERATOR TYPES
// ============================================================================

export interface CreateOperatorDto {
  name: string;
  rut?: string;
  super?: boolean;
  expiration?: string | null;
  status?: boolean;
}

export interface UpdateOperatorDto {
  name?: string;
  rut?: string;
  super?: boolean;
  expiration?: string | null;
  status?: boolean;
}

export interface OperatorQueryDto {
  search?: string;
  status?: string;
  super?: string;
  page?: string;
  limit?: string;
}

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export interface CreateProviderDto {
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
  businessType?: string;
  serviceTypes?: string;
  fleetSize?: number;
  status?: boolean;
  rating?: number;
  observations?: string;
  notes?: string;
}

export interface UpdateProviderDto {
  businessName?: string;
  taxId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  businessType?: string;
  serviceTypes?: string;
  fleetSize?: number;
  status?: boolean;
  rating?: number;
  observations?: string;
  notes?: string;
}

export interface ProviderQueryDto {
  operatorId?: number;
  search?: string;
  status?: boolean;
  businessType?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}

// ============================================================================
// ROLE TYPES
// ============================================================================

export interface RoleCreateDto {
  name: string;
  permissions?: string[];
}

export interface RoleUpdateDto {
  name?: string;
  permissions?: string[];
}

export interface RoleQueryDto {
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// USER QUERY TYPES
// ============================================================================

export interface UserQueryDto {
  search?: string;
  roleId?: number;
  status?: boolean;
  page?: number;
  limit?: number;
}

export interface UserActivityQueryDto {
  userId?: number;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// TRANSPORT ASSIGNMENT TYPES
// ============================================================================

export interface AssignTransportProviderDto {
  operationId: number;
  providerId: number;
  instructions?: string;
  notifyProvider?: boolean;
  assignedVehicle?: string;
  assignedDriver?: string;
}

export interface ConfirmTransportAssignmentDto {
  assignedVehicle?: string;
  assignedDriver?: string;
  estimatedArrival?: string;
  notes?: string;
}

// ============================================================================
// TRANSPORT ORDER TYPES
// ============================================================================

export interface CreateTransportOrderDto {
  operationId: number;
  providerId: number;
  instructions?: string;
  specialRequirements?: string;
  estimatedCost?: number;
  sendNotification?: boolean;
}

// ============================================================================
// COMMON RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DeleteResponse {
  message: string;
}

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

/**
 * Standard API error response structure from backend
 * Matches NestJS validation error format
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  [key: string]: unknown; // Allow additional error properties
}

export interface DeleteRouteResponse {
  message: string;
  route: import("@/types/routes").Route;
}

export interface UserActivityResponse {
  data: import("@/types/users").UserActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
