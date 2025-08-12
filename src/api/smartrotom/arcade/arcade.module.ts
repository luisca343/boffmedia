import { Module } from '@nestjs/common';
import { ArcadeController } from './arcade.controller';
import { ArcadeFacadeService } from './arcade.facade.service';

// Services
import { StreakService } from './services/streak.service';
import { InventoryService } from './services/inventory.service';
import { LootboxService } from './services/lootbox.service';

// Repositories
import { ArcadeStreakRepository } from './repositories/arcade-streak.repository';
import { ArcadeInventoryRepository } from './repositories/arcade-inventory.repository';

// Repository Interfaces & Tokens
import { IArcadeStreakRepository } from './repositories/interfaces/arcade-streak.repository.interface';
import { IArcadeInventoryRepository } from './repositories/interfaces/arcade-inventory.repository.interface';
import { 
  ARCADE_STREAK_REPOSITORY_TOKEN,
  ARCADE_INVENTORY_REPOSITORY_TOKEN 
} from '@api/_utils/repositories/interfaces/repository.token';

// Shared modules
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

@Module({
  imports: [
    DrizzleModule,
  ],
  controllers: [
    ArcadeController,
  ],
  providers: [
    ArcadeFacadeService,
    
    StreakService,
    InventoryService,
    LootboxService,
    
    {
      provide: ARCADE_STREAK_REPOSITORY_TOKEN,
      useClass: ArcadeStreakRepository,
    },
    {
      provide: ARCADE_INVENTORY_REPOSITORY_TOKEN,
      useClass: ArcadeInventoryRepository,
    },
  ],
  exports: [
    ArcadeFacadeService,
    
    StreakService,
    InventoryService,
    LootboxService,
    
    ARCADE_STREAK_REPOSITORY_TOKEN,
    ARCADE_INVENTORY_REPOSITORY_TOKEN,
  ],
})
export class ArcadeModule {}