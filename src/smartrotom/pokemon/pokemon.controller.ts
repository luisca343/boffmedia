import { Controller, Get } from '@nestjs/common';
import { PokemonService } from './pokemon.service';

@Controller('smartrotom/pokemon')
export class PokemonController {
    constructor(private readonly pokemonService: PokemonService) {}
    @Get()
    getPokemon() {
        return this.pokemonService.getPokemon();
    }
}
