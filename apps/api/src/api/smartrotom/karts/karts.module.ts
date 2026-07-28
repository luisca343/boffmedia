import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { KARTS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { KartsController } from './karts.controller';
import { KartsService } from './karts.service';
import { KartsRepository } from './repositories/karts.repository';

@Module({
  imports: [LoggerModule, DrizzleModule],
  controllers: [KartsController],
  providers: [
    KartsService,
    {
      provide: KARTS_REPOSITORY_TOKEN,
      useClass: KartsRepository,
    },
  ],
  exports: [KartsService],
})
export class SmartRotomKartsModule {}
