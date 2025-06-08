import { Module } from '@nestjs/common';
import { ArcadeController } from './arcade.controller';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { StarbankModule } from '../starbank/starbank.module';
import { WingullModule } from '../wingull/wingull.module';
import { ArcadeRepository } from '@repositories/smartrotom/arcade.repository';
import { StreakService } from './services/streak.service';
import { InventoryService } from './services/inventory.service';
import { LootboxService } from './services/lootbox.service';
import { ArcadeFacadeService } from './arcade.facade.service';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule, StarbankModule, WingullModule],
  controllers: [ArcadeController],
  providers: [
    ArcadeRepository,
    StreakService,
    InventoryService,
    LootboxService,
    ArcadeFacadeService,
  ],
  exports: [
    ArcadeFacadeService,
    StreakService,
    InventoryService,
    LootboxService,
  ],
})
export class ArcadeModule {}