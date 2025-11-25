import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

// ============================================================================
// CREATE ROUTE DTO
// ============================================================================
export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

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
  @Min(0)
  @Type(() => Number)
  distance?: number; // km

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  estimatedDuration?: number; // minutos

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @IsIn([
    'urbana',
    'interurbana',
    'minera',
    'rural',
    'carretera',
    'montaña',
    'otra',
  ])
  routeType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @IsIn(['fácil', 'moderada', 'difícil'])
  difficulty?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  roadConditions?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  tollsRequired?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  estimatedTollCost?: number;

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
// UPDATE ROUTE DTO
// ============================================================================
export class UpdateRouteDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  origin?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  destination?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  distance?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  estimatedDuration?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @IsIn([
    'urbana',
    'interurbana',
    'minera',
    'rural',
    'carretera',
    'montaña',
    'otra',
  ])
  routeType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @IsIn(['fácil', 'moderada', 'difícil'])
  difficulty?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  roadConditions?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  tollsRequired?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  estimatedTollCost?: number;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
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

// ============================================================================
// QUERY ROUTE DTO
// ============================================================================
export class RouteQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  search?: string; // búsqueda por nombre, código, origen, destino

  @IsString()
  @IsOptional()
  @IsIn([
    'urbana',
    'interurbana',
    'minera',
    'rural',
    'carretera',
    'montaña',
    'otra',
  ])
  routeType?: string;

  @IsString()
  @IsOptional()
  @IsIn(['fácil', 'moderada', 'difícil'])
  difficulty?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  status?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  tollsRequired?: boolean;
}
