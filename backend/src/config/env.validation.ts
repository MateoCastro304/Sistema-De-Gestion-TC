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

// Lista separada por comas de duraciones, para la escala de bloqueo (ej. 1m,5m,15m,1h).
const LISTA_DURACIONES = /^\d+(ms|s|m|h|d|w|y)?(,\d+(ms|s|m|h|d|w|y)?)*$/;

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

  // Inactividad maxima de una sesion (por defecto 30m).
  @IsOptional()
  @Matches(DURACION, { message: 'SESSION_INACTIVITY_TTL tiene que ser una duracion como 30m' })
  SESSION_INACTIVITY_TTL?: string;

  // Costo de bcrypt (por defecto 12).
  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(15)
  BCRYPT_COST?: number;

  // Cookie del refresh token. Por defecto: refresh_token, /api/auth, Strict, Secure.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  COOKIE_REFRESH_NAME?: string;

  @IsOptional()
  @Matches(/^\//, { message: 'COOKIE_REFRESH_PATH tiene que empezar con /' })
  COOKIE_REFRESH_PATH?: string;

  @IsOptional()
  @IsIn(['Strict', 'Lax', 'None'])
  COOKIE_REFRESH_SAMESITE?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  COOKIE_SECURE?: string;

  // true cuando hay un proxy delante (nginx): req.ip pasa a ser la IP del cliente.
  @IsOptional()
  @IsIn(['true', 'false'])
  TRUST_PROXY?: string;

  // Bloqueo progresivo de ingreso, nivel usuario+IP (por defecto 5, 15m, 90s,5m,15m,30m,1h).
  @IsOptional()
  @IsInt()
  @Min(1)
  LOGIN_LOCK_THRESHOLD?: number;

  @IsOptional()
  @Matches(DURACION, { message: 'LOGIN_LOCK_WINDOW tiene que ser una duracion como 15m' })
  LOGIN_LOCK_WINDOW?: string;

  @IsOptional()
  @Matches(LISTA_DURACIONES, { message: 'LOGIN_LOCK_LADDER tiene que ser una lista de duraciones como 1m,5m,1h' })
  LOGIN_LOCK_LADDER?: string;

  // Nivel solo-usuario, contiene los ataques distribuidos (por defecto 25, 1h, 15m).
  @IsOptional()
  @IsInt()
  @Min(1)
  LOGIN_LOCK_USER_THRESHOLD?: number;

  @IsOptional()
  @Matches(DURACION, { message: 'LOGIN_LOCK_USER_WINDOW tiene que ser una duracion como 1h' })
  LOGIN_LOCK_USER_WINDOW?: string;

  @IsOptional()
  @Matches(LISTA_DURACIONES, { message: 'LOGIN_LOCK_USER_LADDER tiene que ser una lista de duraciones como 15m' })
  LOGIN_LOCK_USER_LADDER?: string;

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

  // Los navegadores descartan una cookie SameSite=None que no sea Secure. Como
  // Secure es true por defecto, solo falla si se apaga a proposito.
  if (validatedConfig.COOKIE_REFRESH_SAMESITE === 'None' && validatedConfig.COOKIE_SECURE === 'false') {
    errors.push('COOKIE_SECURE: SameSite=None exige COOKIE_SECURE=true');
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
