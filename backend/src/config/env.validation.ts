import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

enum Entorno {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum StorageDriver {
  Local = 'local',
  S3 = 's3',
}

// Formato corto de la libreria ms (la que usa jsonwebtoken): 900, 30s, 15m, 12h, 7d.
const DURACION = /^\d+(ms|s|m|h|d|w|y)?$/;

class EnvironmentVariables {
  @IsEnum(Entorno)
  NODE_ENV!: Entorno;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT!: number;

  @IsString()
  @Matches(/^postgres(ql)?:\/\/.+/, { message: 'DATABASE_URL tiene que ser una URL postgresql://...' })
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @Matches(DURACION, { message: 'JWT_EXPIRATION tiene que ser una duracion como 15m o 1h' })
  JWT_EXPIRATION?: string;

  @IsOptional()
  @Matches(DURACION, { message: 'JWT_REFRESH_EXPIRATION tiene que ser una duracion como 7d' })
  JWT_REFRESH_EXPIRATION?: string;

  @IsOptional()
  @IsString()
  ALLOWED_ORIGINS?: string;

  @IsOptional()
  @IsString()
  EXCHANGE_RATE_API_URL?: string;

  @IsOptional()
  @IsString()
  APP_TIMEZONE?: string;

  @IsOptional()
  @IsEnum(StorageDriver)
  STORAGE_DRIVER?: StorageDriver;

  // Solo hacen falta si el driver es s3.
  @ValidateIf((env: EnvironmentVariables) => env.STORAGE_DRIVER === StorageDriver.S3)
  @IsString()
  @IsNotEmpty()
  S3_BUCKET?: string;

  @ValidateIf((env: EnvironmentVariables) => env.STORAGE_DRIVER === StorageDriver.S3)
  @IsString()
  @IsNotEmpty()
  S3_REGION?: string;

  @ValidateIf((env: EnvironmentVariables) => env.STORAGE_DRIVER === StorageDriver.S3)
  @IsString()
  @IsNotEmpty()
  S3_BUCKET_UPLOADS?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  S3_ENDPOINT?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  S3_PUBLIC_ENDPOINT?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  S3_FORCE_PATH_STYLE?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  S3_BACKEND_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  S3_BACKEND_SECRET_KEY?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  }).map((error) => `${error.property}: ${Object.values(error.constraints ?? {}).join(', ')}`);

  // Con el mismo secreto, un refresh token pasaria como access token (y al reves).
  if (validatedConfig.JWT_SECRET && validatedConfig.JWT_SECRET === validatedConfig.JWT_REFRESH_SECRET) {
    errors.push('JWT_REFRESH_SECRET: tiene que ser distinto de JWT_SECRET');
  }

  // Las dos (dev) o ninguna (prod, IAM Role). Con una sola el SDK no puede firmar.
  if (!validatedConfig.S3_BACKEND_ACCESS_KEY !== !validatedConfig.S3_BACKEND_SECRET_KEY) {
    errors.push('S3_BACKEND_ACCESS_KEY, S3_BACKEND_SECRET_KEY: van las dos o ninguna');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return validatedConfig;
}
