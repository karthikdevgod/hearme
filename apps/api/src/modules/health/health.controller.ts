import { Controller, Get, Inject } from '@nestjs/common';
import type { ServerEnv } from '@hearme/config';
import { ENV } from '../../common/config/config.module';

@Controller('health')
export class HealthController {
  constructor(@Inject(ENV) private readonly env: ServerEnv) {}

  @Get()
  check() {
    return { status: 'ok', app: this.env.APP_NAME, env: this.env.NODE_ENV };
  }
}
