    import { Module } from '@nestjs/common';
import { PokemonLogService } from './pokemon-log.service';
import { PokemonLogController } from './pokemon-log.controller';

@Module({
  controllers: [PokemonLogController],
  providers: [PokemonLogService],
})
export class PokemonLogModule {}
