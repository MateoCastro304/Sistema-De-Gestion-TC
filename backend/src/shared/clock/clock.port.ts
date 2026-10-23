/**
 * Reloj del sistema. El dominio y los casos de uso piden la hora acá en vez de
 * llamar a `new Date()`, así los tests pueden fijarla.
 */
export abstract class ClockPort {
  abstract now(): Date;
}
