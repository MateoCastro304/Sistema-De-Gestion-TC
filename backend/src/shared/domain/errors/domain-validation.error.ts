import { DomainError } from './domain.error';

/**
 * Signals that a domain invariant or value-object precondition was violated
 * (invalid CUIT, empty legalName, malformed email, etc). Used across every
 * factory that self-validates on construction so the HTTP filter can map
 * all of them to a 400 without inspecting error messages.
 */
export class DomainValidationError extends DomainError {}
