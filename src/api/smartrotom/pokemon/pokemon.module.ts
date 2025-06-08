import { Module } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { PokemonDataService } from './pokemon-data.service';
import { MoveDataService } from './move-data.service';
import { SpawnDataService } from './spawn-data.service';
import { PokemonImageService } from './pokemon-image.service';
import { WingullModule } from '../wingull/wingull.module';
import { PokemonShowdownService } from './pokemon-showdown.service';
import { SpriteManifestService } from './sprite-manifest.service';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule, WingullModule],
  providers: [PokemonService, PokemonDataService, MoveDataService, SpawnDataService, PokemonImageService, PokemonShowdownService, SpriteManifestService],
  controllers: [PokemonController],
  exports: [PokemonService],
})
export class PokemonModule {}
