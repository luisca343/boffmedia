import { Module } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';
import { DrizzleModule } from '@/drizzle/drizzle.module';
import { PokemonDataService } from './pokemon-data.service';
import { MoveDataService } from './move-data.service';
import { SpawnDataService } from './spawn-data.service';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  providers: [PokemonService, PokemonDataService, MoveDataService, SpawnDataService],
  controllers: [PokemonController],
  exports: [PokemonService],
})
export class PokemonModule {}
