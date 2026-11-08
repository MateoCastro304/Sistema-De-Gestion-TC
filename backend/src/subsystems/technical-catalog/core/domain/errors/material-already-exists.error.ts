import { DomainError } from '../../../../../shared/domain/errors/domain.error';

/** La combinación de nombre y calidad ya está registrada (D-36). */
export class MaterialAlreadyExists extends DomainError {
  readonly code = 'MATERIAL_ALREADY_EXISTS';

  constructor() {
    super('Ya existe un material registrado con ese nombre y calidad');
  }
}
