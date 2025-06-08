import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { QuestRepository } from '@repositories/smartrotom/quest.repository';
import { QuestCacheService } from './services/quest.cache.service';
import { UserQuestService } from './services/user.quest.service';
import { NPCService } from './services/npc.service';
import { ImageService } from './services/image.service';
import { MisionesFacadeService } from './misiones.facade.service';
import { MisionesController } from './misiones.controller';

@Module({
  imports: [LoggerModule, ResponseModule],
  controllers: [MisionesController],
  providers: [
    QuestRepository,
    
    QuestCacheService,
    UserQuestService,
    NPCService,
    ImageService,
    
    MisionesFacadeService,
  ],
  exports: [
    MisionesFacadeService,
    
    QuestCacheService,
    UserQuestService,
    NPCService,
    ImageService,
  ],
})
export class MisionesModule {}