import { Module } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';

@Module({
  providers: [PokemonService],
  controllers: [PokemonController],
  exports: [PokemonService]
})
export class PokemonModule {}
