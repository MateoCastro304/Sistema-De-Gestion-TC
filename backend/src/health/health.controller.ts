import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../shared/http/auth/auth.decorators';
import { HealthService } from './health.service';

/** Chequeo de salud: lo consulta la infraestructura (Docker, el balanceador), que no tiene sesión. */
@Public()
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly health: HealthService) {}

  @Get('db')
  async checkDatabase() {
    try {
      return await this.health.ping();
    } catch (error) {
      this.logger.error('Database health check failed', error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException({
        message: 'Database unavailable.',
        status: 'error',
        database: 'down',
      });
    }
  }
}
