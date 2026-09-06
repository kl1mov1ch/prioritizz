import { Controller, Get, Module } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator, TerminusModule } from '@nestjs/terminus';
import { Public } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller()
class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get('healthz')
  liveness() {
    return { status: 'ok', ts: new Date().toISOString() };
  }

  @Public()
  @Get('readyz')
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.prismaHealth.pingCheck('database', this.prisma)]);
  }
}

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
