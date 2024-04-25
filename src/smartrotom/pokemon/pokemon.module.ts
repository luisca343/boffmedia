import { Module } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { MySQL2Service } from '@/_utils/MySQL2Service';

@Module({
  providers: [PokemonService, MySQL2Service],
  controllers: [PokemonController],
  exports: [PokemonService],
})
export class PokemonModule {}
