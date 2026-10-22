import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { emptyToNull } from '../../../../../shared/http/empty-to-null.transform';

export class CreateManagerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName!: string;

  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string | null;

  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;

  @Transform(emptyToNull)
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  mail?: string | null;
}
