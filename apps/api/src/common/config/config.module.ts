import { Global, Module } from '@nestjs/common';
import { loadServerEnv, type ServerEnv } from '@hearme/config';

export const ENV = Symbol('ENV');

/**
 * Global config module. Validates process.env once at boot via the shared Zod
 * schema and exposes the typed ServerEnv under the ENV token. Inject with
 * `@Inject(ENV) private readonly env: ServerEnv`.
 */
@Global()
@Module({
  providers: [
    {
      provide: ENV,
      useFactory: (): ServerEnv => loadServerEnv(process.env),
    },
  ],
  exports: [ENV],
})
export class ConfigModule {}
