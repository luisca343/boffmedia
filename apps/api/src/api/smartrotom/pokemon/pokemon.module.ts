import { Module, OnModuleInit } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { WingullModule } from '../wingull/wingull.module';

// Import repository and token
import { PokemonRepository } from '@api/smartrotom/pokemon/repositories/pokemon.repository';
import { POKEMON_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

// Import existing services (keep the original file-based services)
import { BaseDataService } from './services/data/base-data.service';
import { PokemonDataService } from './services/data/pokemon-data.service';
import { MoveDataService } from './services/data/move-data.service';
import { SpawnDataService } from './services/data/spawn-data.service';
import { PokemonImageService } from './services/data/pokemon-image.service';
import { SpriteManifestService } from './services/sprite-manifest.service';
import { PokemonShowdownService } from './services/pokemon-showdown.service';

// Import domain services
import { PokemonDataManagementService } from './services/pokemon-data-management.service';
import { PokedexManagementService } from './services/pokedex-management.service';
import { PokemonIntegrationService } from './services/pokemon-integration.service';

// Import facade service
import { PokemonFacadeService } from './pokemon.facade.service';

// Import controller
import { PokemonController } from './pokemon.controller';
import pino from 'pino';

const logger = pino({ name: 'util' });

@Module({
  imports: [
    LoggerModule,
    ResponseModule,
    DrizzleModule,
    WingullModule, // Keep this - PokemonIntegrationService needs WingullFacadeService
  ],
  controllers: [PokemonController],
  providers: [
    // Repository with token binding (add this for clean architecture)
    {
      provide: POKEMON_REPOSITORY_TOKEN,
      useClass: PokemonRepository,
    },

    // Keep the original repository for existing code compatibility
    PokemonRepository,

    // Existing file-based services
    BaseDataService,
    PokemonDataService,
    MoveDataService,
    SpawnDataService,
    PokemonImageService,
    SpriteManifestService,
    PokemonShowdownService,

    // Domain services
    PokemonDataManagementService,
    PokedexManagementService,
    PokemonIntegrationService, // This needs WingullFacadeService

    // Facade service
    PokemonFacadeService,
  ],
  exports: [
    // Export facade for other modules
    PokemonFacadeService,

    // Export core services for potential reuse
    PokemonDataManagementService,

    // Export repository token for testing/clean architecture
    POKEMON_REPOSITORY_TOKEN,
  ],
})
export class PokemonModule implements OnModuleInit {
  constructor(private readonly pokemonFacadeService: PokemonFacadeService) {}

  async onModuleInit() {
    logger.info('Initializing Pokemon service...');
    try {
      await this.pokemonFacadeService.initializeService();
      logger.info('Pokemon service initialized successfully');
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to initialize Pokemon service:');
      throw error;
    }
  }
}
