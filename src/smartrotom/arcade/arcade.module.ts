import { Module } from '@nestjs/common';
import { ArcadeController } from './arcade.controller';
import { ArcadeService } from './arcade.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { PokemonModule } from '../pokemon/pokemon.module';
import { PokemonService } from '../pokemon/pokemon.service';

@Module({
    controllers: [ArcadeController],
    providers: [ArcadeService, MySQL2Service, PokemonService],

})
export class ArcadeModule {}
