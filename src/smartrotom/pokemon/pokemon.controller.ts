import { Controller, Get, Param } from '@nestjs/common';
import { PokemonService } from './pokemon.service';

@Controller('smartrotom/pokemon')
export class PokemonController {
    constructor(private readonly pokemonService: PokemonService) {}
    @Get()
    getPokemon() {
        return this.pokemonService.getPokemon();
    }
    @Get('dex/:dex')
    getPokemonByDex(@Param('dex') dex: number) {
        return this.pokemonService.getPokemonByDex(dex);
    }
    @Get('dexMany/:dex')
    getPokemonByDexMany(@Param('dex') dex: string) {
        const dexArray = dex.split(',').map(Number);
        return this.pokemonService.getManyPokemonByDex(dexArray);
    }
    @Get('names')
    getPokemonNames() {
        return this.pokemonService.getPokemonNames();
    }
    @Get('forms')
    getForms() {
        return this.pokemonService.getPokemonByForm();
    }
    @Get('palettes')
    getPalettes() {
        return this.pokemonService.getPokemonByPalette();
    }
    @Get('types')
    getTypes() {
        return this.pokemonService.getPokemonByType();
    }
    @Get('eggGroups')
    getEggGroups() {
        return this.pokemonService.getPokemonByEggGroup();
    }
    @Get('abilities')
    getAbilities() {
        return this.pokemonService.getPokemonByAbility();
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
    @Get('sheet/:name')
    getSheet(@Param('name') name: string){
        return this.pokemonService.getFromGoogleSheets(name);
    }
}
