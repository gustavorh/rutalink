import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  Min,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// ENUMS
// ============================================================================
export enum VehicleType {
  TRUCK = 'truck',
  VAN = 'van',
  PICKUP = 'pickup',
  FLATBED = 'flatbed',
  TRAILER = 'trailer',
  DUMP_TRUCK = 'dump_truck',
  CRANE_TRUCK = 'crane_truck',
  OTHER = 'other',
}

export enum CapacityUnit {
  KG = 'kg',
  TONS = 'tons',
  M3 = 'm3',
  PASSENGERS = 'passengers',
}

export enum OperationalStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
  RESERVED = 'reserved',
}

export enum DocumentType {
  CIRCULATION_PERMIT = 'circulation_permit', // Permiso de circulación
  TECHNICAL_REVIEW = 'technical_review', // Revisión técnica
  INSURANCE = 'insurance', // Seguro
  OWNERSHIP = 'ownership', // Certificado de propiedad
  GAS_CERTIFICATION = 'gas_certification', // Certificación de gas
  OTHER = 'other',
}

// ============================================================================
// CREATE VEHICLE DTO
// ============================================================================
export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  plateNumber: string; // Patente

  @IsString()
  @IsOptional()
  @MaxLength(100)
  brand?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  model?: string;

  @IsInt()
  @IsOptional()
  @Min(1900)
  year?: number;

  @IsEnum(VehicleType)
  @IsNotEmpty()
  vehicleType: VehicleType;

  @IsInt()
  @IsOptional()
  @Min(0)
  capacity?: number;

  @IsEnum(CapacityUnit)
  @IsOptional()
  capacityUnit?: CapacityUnit;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  vin?: string; // VIN number

  @IsString()
  @IsOptional()
  @MaxLength(50)
  color?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

// ============================================================================
// UPDATE VEHICLE DTO
// ============================================================================
export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  @MaxLength(20)
  plateNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  brand?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  model?: string;

  @IsInt()
  @IsOptional()
  @Min(1900)
  year?: number;

  @IsEnum(VehicleType)
  @IsOptional()
  vehicleType?: VehicleType;

  @IsInt()
  @IsOptional()
  @Min(0)
  capacity?: number;

  @IsEnum(CapacityUnit)
  @IsOptional()
  capacityUnit?: CapacityUnit;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  vin?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  color?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

// ============================================================================
// CREATE VEHICLE DOCUMENT DTO
// ============================================================================
export class CreateVehicleDocumentDto {
  @IsInt()
  @IsNotEmpty()
  vehicleId: number;

  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  documentName: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  fileName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  filePath?: string;

  @IsInt()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  mimeType?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  insuranceCompany?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  policyNumber?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  coverageAmount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

// ============================================================================
// UPDATE VEHICLE DOCUMENT DTO
// ============================================================================
export class UpdateVehicleDocumentDto {
  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  documentName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  fileName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  filePath?: string;

  @IsInt()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  mimeType?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  insuranceCompany?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  policyNumber?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  coverageAmount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================
export class VehicleDocumentResponseDto {
  id: number;
  vehicleId: number;
  documentType: string;
  documentName: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  issueDate?: Date;
  expirationDate?: Date;
  insuranceCompany?: string;
  policyNumber?: string;
  coverageAmount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;

  // Campos calculados
  isExpired?: boolean;
  daysUntilExpiration?: number;
}

export class VehicleResponseDto {
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
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;

  // Relaciones opcionales
  documents?: VehicleDocumentResponseDto[];
  currentDriver?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  operationalStatus?: OperationalStatus;

  // Estadísticas opcionales
  totalOperations?: number;
  upcomingOperations?: number;
  lastOperationDate?: Date;
}

// ============================================================================
// QUERY DTOs
// ============================================================================
export class VehicleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string; // Buscar por patente, marca, modelo

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsEnum(OperationalStatus)
  operationalStatus?: OperationalStatus;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDocuments?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeStats?: boolean;
}

export class UpdateOperationalStatusDto {
  @IsEnum(OperationalStatus)
  @IsNotEmpty()
  status: OperationalStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
