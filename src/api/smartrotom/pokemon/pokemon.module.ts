import { Module, OnModuleInit } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { WingullModule } from '../wingull/wingull.module';

// Import repository
import { PokemonRepository } from '@repositories/smartrotom/pokemon.repository';

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

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule, WingullModule],
  controllers: [PokemonController],
  providers: [
    // Repository
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
    PokemonIntegrationService,
    
    // Facade service
    PokemonFacadeService,
  ],
  exports: [
    PokemonFacadeService,
    PokemonDataManagementService,
  ],
})
export class PokemonModule implements OnModuleInit {
  constructor(private readonly pokemonFacadeService: PokemonFacadeService) {}

  async onModuleInit() {
    console.log('Initializing Pokemon service...');
    try {
      await this.pokemonFacadeService.initializeService();
      console.log('Pokemon service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Pokemon service:', error);
      throw error;
    }
  }
}