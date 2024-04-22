import { Controller, Get, Param } from '@nestjs/common';
import { PokemonService } from './pokemon.service';

@Controller('smartrotom/pokemon')
export class PokemonController {
    constructor(private readonly pokemonService: PokemonService) {}
    @Get()
    getPokemon() {
        return this.pokemonService.getPokemon();
    }
    @Get('defensivescoreranking')
    getDefensiveScoreRanking() {
        return this.pokemonService.getDefensiveScoreRanking();
    }
    @Get('offensivescoreranking')
    getOffensiveScoreRanking() {
        return this.pokemonService.getOffensiveScoreRanking();
    }
    @Get('overallscoreranking')
    getOverallScoreRanking() {
        return this.pokemonService.getOverallRanking();
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
    @Get('nameforms')
    getSpeciesByNameWithForm() {
        return this.pokemonService.getSpeciesByNameWithForm();
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
    @Get('nextprev/:id')
    getNextPrev(@Param('id') id: string) {
        return this.pokemonService.getNextPrev(parseInt(id));
    }
    @Get('search/species/:name')
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

    @Get('evotree/:id')
    getEvoTree(@Param('id') id: string){
        return this.pokemonService.getEvoTree(parseInt(id));
    }

    @Get('moves/:id/:form')
    getMoves(@Param('id') id: number, @Param('form') form: number){
        return this.pokemonService.getMoves(id, form);
    }

    @Get('spawns/:name/')
    getSpawns(@Param('name') name: string){
        return this.pokemonService.getSpawns(name);
    }

    @Get('image/:id/:form/:palette')
    getImage(@Param('id') pokemonId: number, @Param('form') formName: string, @Param('palette') paletteName: string){
        return this.pokemonService.getImage({pokemonId, formName, paletteName});
    }

    @Get('sprite/:id/:form/:palette')
    getSprite(@Param('id') pokemonId: number, @Param('form') formName: string, @Param('palette') paletteName: string){
        return this.pokemonService.getImage({pokemonId, formName, paletteName, type: 'sprite'});
    }

    @Get('item/sprite/:name')
    getItemSprite(@Param('name') name: string){
        return this.pokemonService.getItemSprite(name);
    }

}
