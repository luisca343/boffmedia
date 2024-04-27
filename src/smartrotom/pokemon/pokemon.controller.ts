import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { uuid } from 'drizzle-orm/pg-core';

@Controller('smartrotom/pokemon')
export class PokemonController {
    constructor(private readonly pokemonService: PokemonService) {}
    @Get()
    getPokemon() {
        return this.pokemonService.getPokemon();
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

    @Get('image/:id/:form/:palette/:uuid')
    getImage(@Param('id') pokemonId: number, @Param('form') formName: string, @Param('palette') paletteName: string, @Param('uuid') uuid: string){
        return this.pokemonService.getImage({pokemonId, formName, paletteName, uuid});
    }

    @Get('sprite/:id/:form/:palette/:uuid')
    getSprite(@Param('id') pokemonId: number, @Param('form') formName: string, @Param('palette') paletteName: string, @Param('uuid') uuid: string){
        return this.pokemonService.getImage({pokemonId, formName, paletteName, uuid, type: 'sprite'});
    }

    @Get('item/sprite/:name')
    getItemSprite(@Param('name') name: string){
        return this.pokemonService.getItemSprite(name);
    }

    @Get('pokemonnamepalette')
    getPokemonNamePalette(){
        return this.pokemonService.getPokemonNamePalette();
    }

    @Post('registry')
    registerPokemon(@Body() body: {uuid: string, pokemonId: number, form: string, palette: string, status: number}){
        return this.pokemonService.registerPokemon(body.uuid, body.pokemonId, body.form, body.palette, body.status);
    }

    @Get('pokedex/:uuid')
    getPokedexRegistry(@Param('uuid') uuid: string){
        return this.pokemonService.getPokedex(uuid);
    }

    @Get('registries/:uuid')
    getPokedexRegistries(@Param('uuid') uuid: string){
        console.log(uuid);
        return this.pokemonService.getRegistries(uuid);
    }

}
