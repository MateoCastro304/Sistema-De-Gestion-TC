import { Transform } from 'class-transformer'; //@Transform recibe una función que agarra el valor crudo y devuelve el valor ya modificado.
import { IsString, MinLength, MaxLength } from 'class-validator';
import { trim } from '../../../../../shared/http/trim.transform';
//cuando alguien te dé un objeto de este tipo, revisá que este campo cumpla esta regla
export class CreateCategoryDto {
  @IsString()
  @Transform(trim)
  @MinLength(3)
  @MaxLength(80)
  name: string;
}
