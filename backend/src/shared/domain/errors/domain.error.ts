/**
 * Base class for every error that expresses a violation of the domain's own
 * rules. Concrete subclasses either add semantic detail (SupplierNotFound,
 * SupplierAlreadyExists) or serve as a broad marker for invariant failures
 * (DomainValidationError). The HTTP layer relies on `instanceof DomainError`
 * to distinguish these from infrastructure bugs and pick the right status
 * code without depending on error messages.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    // Restore the prototype chain: extending native Error in TS can drop it
    // when compiled to older targets, which would break `instanceof` checks
    // at runtime. new.target points at the concrete subclass being built.
    Object.setPrototypeOf(this, new.target.prototype);
    // Each subclass gets its own name in stack traces and logs, without
    // having to assign `this.name` manually in every constructor.
    this.name = new.target.name;
  }
}
