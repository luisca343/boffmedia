import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

// Repository
import { RandomizerRepository } from './repositories/randomizer.repository';
import { RANDOMIZER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

// Services
import { EventsService } from './services/events.service';
import { AssignmentsService } from './services/assignments.service';
import { PresetsService } from './services/presets.service';

// Ports + Stubs
import { RANDOMIZER_RUNNER_TOKEN } from './ports/randomizer-runner.port';
import { StubRandomizerRunner } from './stubs/stub-randomizer-runner';
import { FvxRandomizerRunner } from './runner/fvx-randomizer-runner';
import { SETTINGS_SHIM_TOKEN } from './ports/settings-shim.port';
import { StubSettingsShim } from './stubs/stub-settings-shim';
import { FvxSettingsShim } from './shim/fvx-settings-shim';

// Controllers
import { RandomizerController } from './randomizer.controller';
import { RandomizerLauncherController } from './randomizer-launcher.controller';

// External dependencies
import { PacksModule } from '@api/packs/packs.module';

@Module({
  imports: [LoggerModule, DrizzleModule, PacksModule],
  providers: [
    // Repository with token binding
    {
      provide: RANDOMIZER_REPOSITORY_TOKEN,
      useClass: RandomizerRepository,
    },
    // Direct export for compatibility
    RandomizerRepository,

    // Services
    EventsService,
    AssignmentsService,
    PresetsService,

    // Ports + Stubs — env-gated: use real FvxRandomizerRunner if jar is set, else stub
    {
      provide: RANDOMIZER_RUNNER_TOKEN,
      useFactory: (configService: ConfigService, logger: Logger) => {
        const env = configService.get<any>('env') || {};
        if (env.RANDOMIZER_JAR) {
          logger.debug(
            `Using FvxRandomizerRunner with jar: ${env.RANDOMIZER_JAR}`,
          );
          return new FvxRandomizerRunner(logger, configService);
        } else {
          logger.debug(
            'RANDOMIZER_JAR not set; using StubRandomizerRunner (throws 503)',
          );
          return new StubRandomizerRunner();
        }
      },
      inject: [ConfigService, Logger],
    },
    {
      provide: SETTINGS_SHIM_TOKEN,
      useFactory: (configService: ConfigService, logger: Logger) => {
        const env = configService.get<any>('env') || {};
        if (env.RANDOMIZER_SHIM_JAR && env.RANDOMIZER_JAR) {
          logger.debug(
            `Using FvxSettingsShim with shim jar: ${env.RANDOMIZER_SHIM_JAR}`,
          );
          return new FvxSettingsShim(logger, configService);
        } else {
          logger.debug(
            'RANDOMIZER_SHIM_JAR or RANDOMIZER_JAR not set; using StubSettingsShim (throws 503)',
          );
          return new StubSettingsShim();
        }
      },
      inject: [ConfigService, Logger],
    },
  ],
  controllers: [RandomizerController, RandomizerLauncherController],
  exports: [RANDOMIZER_REPOSITORY_TOKEN, RandomizerRepository],
})
export class RandomizerModule {}
