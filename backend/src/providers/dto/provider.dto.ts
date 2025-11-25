import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

// ============================================================================
// CREATE PROVIDER DTO
// ============================================================================

export class CreateProviderDto {
  @IsInt()
  @IsNotEmpty()
  operatorId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  businessName: string; // razón social

  @IsString()
  @IsOptional()
  @MaxLength(20)
  taxId?: string; // RUT de la empresa

  @IsString()
  @IsOptional()
  @MaxLength(200)
  contactName?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

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

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  businessType?: string; // tipo de servicio: transporte, logística, operador logístico

  @IsString()
  @IsOptional()
  @MaxLength(500)
  serviceTypes?: string; // tipos de servicios que ofrece (separados por coma)

  @IsInt()
  @IsOptional()
  @Min(0)
  fleetSize?: number; // tamaño de flota

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  rating?: number; // calificación del proveedor (1-5)

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observations?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

// ============================================================================
// UPDATE PROVIDER DTO
// ============================================================================

export class UpdateProviderDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  businessName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  taxId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  contactName?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

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

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  businessType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  serviceTypes?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  fleetSize?: number;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  rating?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observations?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

// ============================================================================
// QUERY DTO
// ============================================================================

export class ProviderQueryDto extends PaginationQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  operatorId?: number;

  @IsString()
  @IsOptional()
  search?: string; // Búsqueda por nombre, taxId, contacto

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  status?: boolean;

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  minRating?: number;
}
