/**
 * Reloj del sistema. El dominio y los casos de uso piden la hora acá en vez de
 * llamar a `new Date()`, así los tests pueden fijarla.
 *
 * `now()` es un instante (se guarda y se informa en UTC). La zona horaria del
 * negocio (`APP_TIMEZONE`, Argentina) solo interviene en lo que depende del
 * día calendario: `today()` y `endOfDay()`.
 */
export abstract class ClockPort {
  /** El instante actual. */
  abstract now(): Date;

  /** La fecha de hoy en la zona del negocio, como `YYYY-MM-DD`. */
  abstract today(): string;

  /** El instante en que termina ese día (`YYYY-MM-DD`) en la zona del negocio: 23:59:59.999 locales. */
  abstract endOfDay(date: string): Date;
}
