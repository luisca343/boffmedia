import { Controller, Get, Param } from '@nestjs/common';
import { PokemonService } from './pokemon.service';

@Controller('smartrotom/pokemon')
export class PokemonController {
    constructor(private readonly pokemonService: PokemonService) {}
    @Get()
    getPokemon() {
        return this.pokemonService.getPokemon();
    }
    @Get('names')
    getPokemonNames() {
        return this.pokemonService.getPokemonNames();
    }
    @Get('count')
    countPokemon() {
        return this.pokemonService.countPokemon();
    }
    @Get('species/:name')
    getPokemonByName(@Param('name') name: string){
        return this.pokemonService.getPokemonByName(name);
    }
    @Get('stats/:name')
    getStatsByName(@Param('name') name: string){
        return this.pokemonService.getStatsByName(name);
    }
    @Get('sheet')
    getSheet(){
        return this.pokemonService.getFromGoogleSheets();
    }
}
