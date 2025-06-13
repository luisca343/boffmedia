import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { PokemonFacadeService } from '@api/smartrotom/pokemon/pokemon.facade.service';

@Module({})
export class ChatModule {
    imports: [PokemonFacadeService, DrizzleModule]
}
