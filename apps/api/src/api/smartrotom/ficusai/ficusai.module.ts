import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { PokemonModule } from '@api/smartrotom/pokemon/pokemon.module';
import { FicusAIController } from './ficusai.controller';
import { FicusAIFacadeService } from './ficusai.facade.service';
import { MessageService } from './services/messages.service';
import { AIService } from './services/ai-service';
import { PokemonDataService } from './services/pokemon-data.service';
import { FicusAIRepository } from './repositories/ficusai.repository';
import { FICUSAI_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

@Module({
  imports: [
    DrizzleModule,
    LoggerModule,
    PokemonModule, // Import PokemonModule to get PokemonFacadeService
  ],
  controllers: [FicusAIController],
  providers: [
    // Facade Service
    FicusAIFacadeService,

    // Business Logic Services
    MessageService,
    AIService,
    PokemonDataService,

    // Repository
    {
      provide: FICUSAI_REPOSITORY_TOKEN,
      useClass: FicusAIRepository,
    },
  ],
  exports: [
    FicusAIFacadeService,
    MessageService,
    AIService,
    PokemonDataService,
  ],
})
export class FicusAIModule {}
