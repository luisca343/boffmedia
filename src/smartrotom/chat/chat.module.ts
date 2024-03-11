import { Module } from '@nestjs/common';
import { PokemonService } from '../pokemon/pokemon.service';

@Module({})
export class ChatModule {
    imports: [PokemonService]
}
