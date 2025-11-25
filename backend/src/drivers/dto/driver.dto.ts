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
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

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

export class DriverQueryDto extends PaginationQueryDto {
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
