import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDateString,
  IsNotEmpty,
  MaxLength,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// DRIVER DTOs
// ============================================================================

export class CreateDriverDto {
  @IsInt()
  @IsNotEmpty()
  operatorId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  rut: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  emergencyContactPhone?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['A1', 'A2', 'A3', 'A4', 'A5', 'B', 'C', 'D', 'E', 'F'])
  licenseType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  licenseNumber: string;

  @IsDateString()
  @IsNotEmpty()
  licenseExpirationDate: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  region?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsBoolean()
  @IsOptional()
  isExternal?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalCompany?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateDriverDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  @IsIn(['A1', 'A2', 'A3', 'A4', 'A5', 'B', 'C', 'D', 'E', 'F'])
  licenseType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  licenseNumber?: string;

  @IsDateString()
  @IsOptional()
  licenseExpirationDate?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  region?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsBoolean()
  @IsOptional()
  isExternal?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  externalCompany?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class DriverQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  operatorId?: number;

  @IsString()
  @IsOptional()
  search?: string; // Búsqueda por nombre, rut, email

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  status?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isExternal?: boolean;

  @IsString()
  @IsOptional()
  licenseType?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;
}

// ============================================================================
// DRIVER DOCUMENT DTOs
// ============================================================================

export class CreateDriverDocumentDto {
  @IsInt()
  @IsNotEmpty()
  driverId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsIn([
    'license',
    'certificate',
    'medical',
    'psychotechnical',
    'training',
    'insurance',
    'other',
  ])
  documentType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  documentName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  filePath: string;

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
  @MaxLength(500)
  notes?: string;
}

export class UpdateDriverDocumentDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  documentName?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

// ============================================================================
// VEHICLE DTOs
// ============================================================================

export class CreateVehicleDto {
  @IsInt()
  @IsNotEmpty()
  operatorId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  plateNumber: string;

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
  year?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  vehicleType: string;

  @IsInt()
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  capacityUnit?: string;

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

export class UpdateVehicleDto {
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
  year?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  vehicleType?: string;

  @IsInt()
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  capacityUnit?: string;

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

export class VehicleQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  operatorId?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  status?: boolean;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;
}

// ============================================================================
// DRIVER-VEHICLE ASSIGNMENT DTOs
// ============================================================================

export class AssignDriverToVehicleDto {
  @IsInt()
  @IsNotEmpty()
  driverId: number;

  @IsInt()
  @IsNotEmpty()
  vehicleId: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class UnassignDriverFromVehicleDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

// ============================================================================
// OPERATION DTOs
// ============================================================================

export class CreateOperationDto {
  @IsInt()
  @IsNotEmpty()
  operatorId: number;

  @IsInt()
  @IsNotEmpty()
  driverId: number;

  @IsInt()
  @IsNotEmpty()
  vehicleId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  operationNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  operationType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  origin: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  destination: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledStartDate: string;

  @IsDateString()
  @IsOptional()
  scheduledEndDate?: string;

  @IsInt()
  @IsOptional()
  distance?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  cargoDescription?: string;

  @IsInt()
  @IsOptional()
  cargoWeight?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateOperationDto {
  @IsInt()
  @IsOptional()
  driverId?: number;

  @IsInt()
  @IsOptional()
  vehicleId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  operationType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  origin?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  destination?: string;

  @IsDateString()
  @IsOptional()
  scheduledStartDate?: string;

  @IsDateString()
  @IsOptional()
  scheduledEndDate?: string;

  @IsDateString()
  @IsOptional()
  actualStartDate?: string;

  @IsDateString()
  @IsOptional()
  actualEndDate?: string;

  @IsInt()
  @IsOptional()
  distance?: number;

  @IsString()
  @IsOptional()
  @IsIn(['scheduled', 'in-progress', 'completed', 'cancelled'])
  status?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  cargoDescription?: string;

  @IsInt()
  @IsOptional()
  cargoWeight?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class OperationQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  operatorId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  driverId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  vehicleId?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  operationType?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;
}
