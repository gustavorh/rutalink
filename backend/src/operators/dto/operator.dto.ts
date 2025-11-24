import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsISO8601,
  Matches,
  ValidateIf,
} from 'class-validator';

interface OperatorDtoWithExpiration {
  expiration?: string | null;
}

export class CreateOperatorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(12)
  @Matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, {
    message: 'RUT must be in format XX.XXX.XXX-X',
  })
  rut?: string;

  @IsBoolean()
  @IsOptional()
  super?: boolean;

  @ValidateIf(
    (o: OperatorDtoWithExpiration) =>
      o.expiration !== '' &&
      o.expiration !== null &&
      o.expiration !== undefined,
  )
  @IsISO8601({ strict: true })
  @IsOptional()
  expiration?: string | null;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export class UpdateOperatorDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(12)
  @Matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, {
    message: 'RUT must be in format XX.XXX.XXX-X',
  })
  rut?: string;

  @IsBoolean()
  @IsOptional()
  super?: boolean;

  @ValidateIf(
    (o: OperatorDtoWithExpiration) =>
      o.expiration !== '' &&
      o.expiration !== null &&
      o.expiration !== undefined,
  )
  @IsISO8601({ strict: true })
  @IsOptional()
  expiration?: string | null;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
