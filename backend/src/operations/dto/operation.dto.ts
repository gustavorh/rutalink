import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsNotEmpty,
  MaxLength,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// OPERATION DTOs
// ============================================================================

export class CreateOperationDto {
  @IsInt()
  @IsNotEmpty()
  operatorId: number;

  @IsInt()
  @IsOptional()
  clientId?: number;

  @IsInt()
  @IsOptional()
  providerId?: number;

  @IsInt()
  @IsOptional()
  routeId?: number;

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
  clientId?: number;

  @IsInt()
  @IsOptional()
  providerId?: number;

  @IsInt()
  @IsOptional()
  routeId?: number;

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
  clientId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  providerId?: number;

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
// BATCH UPLOAD DTOs
// ============================================================================

export class OperationExcelRowDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  operationNumber: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledStartDate: string;

  @IsDateString()
  @IsOptional()
  scheduledEndDate?: string;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  providerName?: string;

  @IsString()
  @IsOptional()
  routeName?: string;

  @IsString()
  @IsNotEmpty()
  driverRut: string;

  @IsString()
  @IsNotEmpty()
  vehiclePlateNumber: string;

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

export class BatchUploadOperationsDto {
  @IsInt()
  @IsNotEmpty()
  operatorId: number;

  @IsNotEmpty()
  operations: OperationExcelRowDto[];
}

// ============================================================================
// PDF REPORT DTOs
// ============================================================================

export class GenerateReportDto {
  @IsOptional()
  includePhotos?: boolean = true;

  @IsOptional()
  includeTimeline?: boolean = true;

  @IsOptional()
  includeIncidents?: boolean = true;

  @IsString()
  @IsOptional()
  @IsIn(['es', 'en'])
  language?: string = 'es';
}
