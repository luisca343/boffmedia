import { Module } from '@nestjs/common';
import { ArcadeController } from './arcade.controller';
import { ArcadeService } from './arcade.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { PokemonService } from '../pokemon/pokemon.service';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';

@Module({
    imports: [LoggerModule, ResponseModule],
    controllers: [ArcadeController],
    providers: [ArcadeService, MySQL2Service, PokemonService],

})
export class ArcadeModule {}
