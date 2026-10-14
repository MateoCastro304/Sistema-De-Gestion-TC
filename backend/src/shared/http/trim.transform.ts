import type { TransformFnParams } from 'class-transformer';

// class-transformer tipa `value` como `any`; se descarta sin asumir que
// siempre llega un string (un payload malformado lo rechaza el ValidationPipe
// despues, no este transform).
export function trim({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') return value as unknown;
  return value.trim();
}
