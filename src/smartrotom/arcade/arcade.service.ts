import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Inject, Injectable } from '@nestjs/common';
import { PokemonService } from '../pokemon/pokemon.service';

@Injectable()
export class ArcadeService {
    constructor(
        private db: MySQL2Service,
        private pokemonService: PokemonService
    ) {}

    getWordle() {
        return 'wordle';
    }
}
