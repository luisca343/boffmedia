import { Module } from '@nestjs/common';
import { PokemonService } from '../pokemon/pokemon.service';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

@Module({})
export class ChatModule {
    imports: [PokemonService, DrizzleModule]
}
