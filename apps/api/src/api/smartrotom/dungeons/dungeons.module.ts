import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { DUNGEONS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { DungeonsController } from './dungeons.controller';
import { DungeonsService } from './dungeons.service';
import { DungeonsRepository } from './repositories/dungeons.repository';

@Module({
  imports: [LoggerModule, DrizzleModule],
  controllers: [DungeonsController],
  providers: [
    DungeonsService,
    {
      provide: DUNGEONS_REPOSITORY_TOKEN,
      useClass: DungeonsRepository,
    },
  ],
  exports: [DungeonsService],
})
export class SmartRotomDungeonsModule {}
