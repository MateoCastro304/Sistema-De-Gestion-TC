import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /health/db
   * Verifica la conexion a la base ejecutando un `SELECT 1`.
   * Responde 200 si la base responde, 503 si no.
   */
  @Get('db')
  async checkDatabase() {
    const startedAt = Date.now();
    try {
      await this.prisma.ping();
      return {
        status: 'ok',
        database: 'up',
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
        message: error instanceof Error ? error.message : 'Error desconocido de base de datos',
      });
    }
  }
}
