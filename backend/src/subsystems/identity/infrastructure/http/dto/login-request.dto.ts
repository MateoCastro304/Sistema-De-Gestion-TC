import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { trim } from '../../../../../shared/http/trim.transform';

/**
 * Cuerpo de `POST /auth/login` (LoginRequest). Los dos campos son obligatorios:
 * uno vacío es un 400 antes de intentar autenticar y no cuenta como intento
 * fallido. La contraseña no se recorta, porque los espacios pueden ser parte de ella.
 */
export class LoginRequestDto {
  @Transform(trim)
  @IsString({ message: 'Ingresá tu nombre de usuario' })
  @IsNotEmpty({ message: 'Ingresá tu nombre de usuario' })
  username!: string;

  @IsString({ message: 'Ingresá tu contraseña' })
  @IsNotEmpty({ message: 'Ingresá tu contraseña' })
  password!: string;
}
