import type { TransformFnParams } from 'class-transformer';

// El frontend manda '' cuando un campo opcional queda vacío: se guarda como null.
export function emptyToNull({ value }: TransformFnParams): string | null | undefined {
  if (typeof value !== 'string') return value as string | null | undefined;
  return value.trim() === '' ? null : value;
}
