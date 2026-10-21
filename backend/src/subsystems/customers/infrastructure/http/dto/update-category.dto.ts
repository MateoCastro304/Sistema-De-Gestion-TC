import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
//recibe una clase y devuelve una nueva clase, idéntica a la original, pero con todos los campos vueltos opcionales, manteniendo todos sus decoradores de validación intactos.
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
