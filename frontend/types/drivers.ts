/**
 * TypeScript Types for Drivers Module
 */

// ============================================================================
// DRIVER TYPES
// ============================================================================

export interface Driver {
  id: number;
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
  status: boolean;
  isExternal: boolean;
  externalCompany?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
}

export interface CreateDriverInput {
  operatorId: number;
  rut: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  licenseType: string;
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

export type UpdateDriverInput = Partial<
  Omit<CreateDriverInput, "operatorId" | "rut">
>;

export interface DriverQueryParams {
  operatorId?: number;
  search?: string;
  status?: boolean;
  isExternal?: boolean;
  licenseType?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedDrivers {
  data: Driver[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// DRIVER DOCUMENT TYPES
// ============================================================================

export type DocumentType =
  | "license"
  | "certificate"
  | "medical"
  | "psychotechnical"
  | "training"
  | "insurance"
  | "other";

export interface DriverDocument {
  id: number;
  driverId: number;
  documentType: DocumentType;
  documentName: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  issueDate?: string;
  expirationDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
}

export interface CreateDriverDocumentInput {
  driverId: number;
  documentType: DocumentType;
  documentName: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  issueDate?: string;
  expirationDate?: string;
  notes?: string;
}

export interface UpdateDriverDocumentInput {
  documentName?: string;
  issueDate?: string;
  expirationDate?: string;
  notes?: string;
}

// ============================================================================
// VEHICLE TYPES
// ============================================================================

export interface Vehicle {
  id: number;
  operatorId: number;
  plateNumber: string;
  brand?: string;
  model?: string;
  year?: number;
  vehicleType: string;
  capacity?: number;
  capacityUnit?: string;
  vin?: string;
  color?: string;
  status: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
}

export interface CreateVehicleInput {
  operatorId: number;
  plateNumber: string;
  brand?: string;
  model?: string;
  year?: number;
  vehicleType: string;
  capacity?: number;
  capacityUnit?: string;
  vin?: string;
  color?: string;
  status?: boolean;
  notes?: string;
}

export type UpdateVehicleInput = Partial<
  Omit<CreateVehicleInput, "operatorId" | "plateNumber">
>;

export interface VehicleQueryParams {
  operatorId?: number;
  search?: string;
  status?: boolean;
  vehicleType?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedVehicles {
  data: Vehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// DRIVER-VEHICLE ASSIGNMENT TYPES
// ============================================================================

export interface DriverVehicleAssignment {
  id: number;
  driverId: number;
  vehicleId: number;
  assignedAt: string;
  unassignedAt?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
}

export interface DriverVehicleAssignmentWithVehicle {
  assignment: DriverVehicleAssignment;
  vehicle: Vehicle;
}

export interface AssignDriverToVehicleInput {
  driverId: number;
  vehicleId: number;
  notes?: string;
}

export interface UnassignDriverFromVehicleInput {
  notes?: string;
}

// ============================================================================
// OPERATION TYPES
// ============================================================================

export type OperationStatus =
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled";

export interface Operation {
  id: number;
  operatorId: number;
  driverId: number;
  vehicleId: number;
  operationNumber: string;
  operationType: string;
  origin: string;
  destination: string;
  scheduledStartDate: string;
  scheduledEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  distance?: number;
  status: OperationStatus;
  cargoDescription?: string;
  cargoWeight?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
}

export interface OperationWithDetails {
  operation: Operation;
  driver: Driver;
  vehicle: Vehicle;
}

export interface CreateOperationInput {
  operatorId: number;
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

export interface UpdateOperationInput
  extends Partial<
    Omit<CreateOperationInput, "operatorId" | "operationNumber">
  > {
  actualStartDate?: string;
  actualEndDate?: string;
  status?: OperationStatus;
}

export interface OperationQueryParams {
  operatorId?: number;
  driverId?: number;
  vehicleId?: number;
  status?: OperationStatus;
  operationType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedOperations {
  data: OperationWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// DRIVER STATISTICS TYPES
// ============================================================================

export interface DriverStatistics {
  totalOperations: number;
  completedOperations: number;
  inProgressOperations: number;
  scheduledOperations: number;
  cancelledOperations: number;
  totalDistance: number;
}

// ============================================================================
// LICENSE TYPE CONSTANTS
// ============================================================================

export const LICENSE_TYPES = [
  { value: "A1", label: "A1 - Motocicletas hasta 125cc" },
  { value: "A2", label: "A2 - Motocicletas hasta 400cc" },
  { value: "A3", label: "A3 - Motocicletas sin restricción" },
  { value: "A4", label: "A4 - Vehículos motorizados de carga" },
  { value: "A5", label: "A5 - Vehículos motorizados de transporte" },
  { value: "B", label: "B - Automóviles y vehículos ligeros" },
  { value: "C", label: "C - Vehículos pesados" },
  { value: "D", label: "D - Transporte de pasajeros" },
  { value: "E", label: "E - Tractores y maquinaria agrícola" },
  { value: "F", label: "F - Vehículos de emergencia" },
] as const;

// ============================================================================
// DOCUMENT TYPE CONSTANTS
// ============================================================================

export const DOCUMENT_TYPES = [
  { value: "license", label: "Licencia de Conducir" },
  { value: "certificate", label: "Certificado" },
  { value: "medical", label: "Certificado Médico" },
  { value: "psychotechnical", label: "Examen Psicotécnico" },
  { value: "training", label: "Certificado de Capacitación" },
  { value: "insurance", label: "Seguro" },
  { value: "other", label: "Otro" },
] as const;

// ============================================================================
// OPERATION STATUS CONSTANTS
// ============================================================================

export const OPERATION_STATUSES = [
  { value: "scheduled", label: "Programado", color: "blue" },
  { value: "in-progress", label: "En Progreso", color: "yellow" },
  { value: "completed", label: "Completado", color: "green" },
  { value: "cancelled", label: "Cancelado", color: "red" },
] as const;
