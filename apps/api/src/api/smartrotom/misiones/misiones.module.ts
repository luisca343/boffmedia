import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';

// Repository
import { QuestRepository } from './repositories/quest.repository';
import { QUEST_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

// Services
import { NPCService } from './services/npc.service';
import { ImageService } from './services/image.service';
import { QuestCacheService } from './services/quest.cache.service';
import { UserQuestService } from './services/user.quest.service';

// Facade and Controller
import { MisionesFacadeService } from './misiones.facade.service';
import { MisionesController } from './misiones.controller';

@Module({
  imports: [
    ConfigModule, // Add this to make ConfigService available
    LoggerModule,
    ResponseModule,
  ],
  controllers: [MisionesController],
  providers: [
    // Repository with token binding
    {
      provide: QUEST_REPOSITORY_TOKEN,
      useClass: QuestRepository,
    },

    // Core Services
    QuestCacheService,
    UserQuestService,
    NPCService,
    ImageService,

    // Facade Service
    MisionesFacadeService,
  ],
  exports: [
    // Export facade for other modules
    MisionesFacadeService,

    // Export services for potential reuse
    QuestCacheService,
    UserQuestService,
    NPCService,
    ImageService,

    // Export repository token for testing
    QUEST_REPOSITORY_TOKEN,
  ],
})
export class MisionesModule {}
