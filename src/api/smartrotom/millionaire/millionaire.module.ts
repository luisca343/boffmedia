import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

import { MillionaireRepository } from './repositories/millionaire.repository';
import { MILLIONAIRE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

import { EventService } from './services/event.service';
import { QuestionService } from './services/question.service';
import { GameStateService } from './services/game-state.service';
import { LifelineService } from './services/lifeline.service';

import { MillionaireFacadeService } from './millionaire.facade.service';
import { MillionaireController } from './millionaire.controller';
import { MillionaireSocketService } from './gateway/millionaire.gateway';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [MillionaireController],
  providers: [
    {
      provide: MILLIONAIRE_REPOSITORY_TOKEN,
      useClass: MillionaireRepository,
    },
    
    EventService,
    QuestionService,
    GameStateService,
    LifelineService,
    
    MillionaireFacadeService,
    MillionaireSocketService,
  ],
  exports: [
    MillionaireFacadeService,
    MillionaireSocketService,
  ],
})
export class MillionaireModule {}
