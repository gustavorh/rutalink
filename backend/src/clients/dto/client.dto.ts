import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

// ============================================================================
// CLIENT DTOs
// ============================================================================

export class CreateClientDto {
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
  contactName?: string; // nombre de contacto

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
  @IsIn([
    'minería',
    'construcción',
    'industrial',
    'agricultura',
    'transporte',
    'energía',
    'forestal',
    'pesca',
    'retail',
    'servicios',
    'manufactura',
    'tecnología',
    'otro',
  ])
  industry?: string; // rubro

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observations?: string; // observaciones generales del cliente

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateClientDto {
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
  @IsIn([
    'minería',
    'construcción',
    'industrial',
    'agricultura',
    'transporte',
    'energía',
    'forestal',
    'pesca',
    'retail',
    'servicios',
    'manufactura',
    'tecnología',
    'otro',
  ])
  industry?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observations?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class ClientQueryDto extends PaginationQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  operatorId?: number;

  @IsString()
  @IsOptional()
  search?: string; // Búsqueda por nombre comercial, razón social, contacto

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  status?: boolean;

  @IsString()
  @IsOptional()
  industry?: string; // filtrar por rubro

  @IsString()
  @IsOptional()
  city?: string; // filtrar por ciudad

  @IsString()
  @IsOptional()
  region?: string; // filtrar por región
}

// ============================================================================
// CLIENT OPERATIONS QUERY DTO
// ============================================================================

export class ClientOperationsQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  status?: string; // filtrar por estado de operación

  @IsString()
  @IsOptional()
  operationType?: string; // filtrar por tipo de operación

  @IsString()
  @IsOptional()
  startDate?: string; // fecha inicio del rango

  @IsString()
  @IsOptional()
  endDate?: string; // fecha fin del rango
}
