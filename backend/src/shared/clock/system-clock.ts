import { Injectable } from '@nestjs/common';
import { ClockPort } from './clock.port';

export const DEFAULT_TIME_ZONE = 'America/Argentina/Cordoba';

/**
 * Reloj real. Resuelve el día calendario en la zona del negocio con `Intl`,
 * sin depender de que la zona tenga o no horario de verano. Una zona inválida
 * hace fallar la construcción, o sea el arranque de la aplicación.
 */
@Injectable()
export class SystemClock extends ClockPort {
  private readonly dateTimeFormat: Intl.DateTimeFormat;

  constructor(private readonly timeZone: string = DEFAULT_TIME_ZONE) {
    super();
    this.dateTimeFormat = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  now(): Date {
    return new Date();
  }

  today(): string {
    const { year, month, day } = this.localParts(this.now());
    return `${year}-${month}-${day}`;
  }

  endOfDay(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    // Las 23:59:59.999 locales leídas como si fueran UTC; se corrige por el desfase de la zona en ese día.
    const wallClockAsUtc = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
    return new Date(wallClockAsUtc - this.offsetMs(new Date(wallClockAsUtc)));
  }

  /** Diferencia entre la hora local y UTC en ese instante (negativa al oeste de Greenwich). */
  private offsetMs(instant: Date): number {
    const p = this.localParts(instant);
    const localAsUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return localAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
  }

  private localParts(instant: Date): Record<string, string> {
    const parts: Record<string, string> = {};
    for (const part of this.dateTimeFormat.formatToParts(instant)) parts[part.type] = part.value;
    return parts;
  }
}
