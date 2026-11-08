const UNIT_SECONDS: Record<string, number> = {
  ms: 0.001,
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
  y: 31536000,
};

const DURATION = /^(\d+)(ms|s|m|h|d|w|y)?$/;

/**
 * Convierte una duración como `30s`, `15m`, `1h` o `7d` a segundos. Un número
 * sin unidad son **segundos** (la librería `ms` de jsonwebtoken lo leería como
 * milisegundos, y ese descuido da tokens que vencen al instante).
 *
 * Es el mismo formato que valida `env.validation.ts`.
 *
 * @throws {Error} si el texto no es una duración.
 */
export function parseDurationSeconds(text: string): number {
  const match = DURATION.exec(text);
  if (!match) throw new Error(`"${text}" no es una duración válida (ej. 30s, 15m, 1h, 7d).`);

  const [, amount, unit = 's'] = match;
  return Number(amount) * UNIT_SECONDS[unit];
}

/** Lista separada por comas de duraciones (`90s,5m,1h`), en segundos y en el mismo orden. */
export function parseDurationListSeconds(text: string): number[] {
  return text.split(',').map((item) => parseDurationSeconds(item.trim()));
}
