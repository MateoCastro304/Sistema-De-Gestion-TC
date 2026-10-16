import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateFactoryDto } from './create-factory.dto';

// El CUIT no se puede modificar: se excluye del DTO y el ValidationPipe
// (whitelist) lo descarta si llega.
export class UpdateFactoryDto extends PartialType(OmitType(CreateFactoryDto, ['cuit'] as const)) {}
