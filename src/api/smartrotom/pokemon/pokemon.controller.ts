import { Body, Controller, Get, HttpStatus, Param, Post, UseInterceptors } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PokemonShowdownService } from './pokemon-showdown.service';
import { SpriteManifestService } from './sprite-manifest.service';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { WingullFacadeService } from '../wingull/wingull.facade.service';

@ApiTags('smartrotom/pokemon')
@Controller('smartrotom/pokemon')
@UseInterceptors(ResponseInterceptor)
export class PokemonController {  
    constructor(
        private readonly pokemonService: PokemonService,
        private readonly wingullService: WingullFacadeService,
        private readonly pokemonShowdownService: PokemonShowdownService,
        private readonly spriteManifestService: SpriteManifestService,
    ) {}
    
    @Get()
    @ApiOperation({ summary: 'Get all Pokémon' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemon() {
        return await this.pokemonService.getAllPokemon();
    }

    @Get('dex/:dex')
    @ApiOperation({ summary: 'Get Pokémon by Dex number' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemonByDex(@Param('dex') dex: number) {
        return await this.pokemonService.getPokemonByDex(dex);
    }

    @Get('moves')
    @ApiOperation({ summary: 'Get all Pokémon moves, and which Pokémon learn them' })
    @ApiResponse({ status: HttpStatus.OK, description: 'All Pokémon moves retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve all Pokémon moves.' })
    async getAllMoves() {
        return await this.pokemonService.getAllMoves();
    }

    @Get('moves/:id/:form')
    @ApiOperation({ summary: 'Get Pokémon moves by ID and form' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon moves retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon moves.' })
    async getMoves(@Param('id') id: number, @Param('form') form: number) {
        return await this.pokemonService.getMoves(id, form);
    }
    
    @Get('names')
    @ApiOperation({ summary: 'Get Pokémon names' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon names retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon names.' })
    async getPokemonNames() {
        return await this.pokemonService.getPokemonNames();
    }
    
    @Get('spawns/:name')
    @ApiOperation({ summary: 'Get spawns by Pokémon name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Spawns retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve spawns.' })
    async getSpawns(@Param('name') name: string) {
        return await this.pokemonService.getSpawnByPokemon(name);
    }

    @Get('move/:name')
    @ApiOperation({ summary: 'Get move by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Move retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve move.' })
    async getMove(@Param('name') name: string) {
        return await this.pokemonService.getMove(name);
    }

    @Get('move/:name/pokemon')
    @ApiOperation({ summary: 'Get Pokémon by move name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemonByMove(@Param('name') name: string) {
        return await this.pokemonService.getPokemonByMove(name);
    }
    
    @Get('biomes')
    @ApiOperation({ summary: 'Get all biomes' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Biomes retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve biomes.' })
    async getBiomes() {
        return await this.pokemonService.getBiomes();
    }
    
    @Get('biome/:name')
    @ApiOperation({ summary: 'Get Pokémon by biome name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemonByBiome(@Param('name') name: string) {
        return await this.pokemonService.getPokemonByBiome(name);
    }

    @Get('image/:id/:form/:palette/:uuid/:hide')
    @ApiOperation({ summary: 'Get Pokémon image' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Image retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve image.' })
    async getImage(
        @Param('id') pokemonId: number,
        @Param('form') formName: string,
        @Param('palette') paletteName: string,
        @Param('uuid') uuid: string,
        @Param('hide') hide: number,
    ) {
        return await this.pokemonService.getImage({ pokemonId, formName, paletteName, uuid, hide });
    }

    @Get('sprite/:id/:form/:palette/:uuid/:hide')
    @ApiOperation({ summary: 'Get Pokémon sprite' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Sprite retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve sprite.' })
    async getSprite(
        @Param('id') pokemonId: number,
        @Param('form') formName: string,
        @Param('palette') paletteName: string,
        @Param('uuid') uuid: string,
        @Param('hide') hide: number,
    ) {
        return await this.pokemonService.getImage({ pokemonId, formName, paletteName, uuid, type: 'sprite', hide });
    }

    @Get('nextprev/:id')
    @ApiOperation({ summary: 'Get next and previous Pokémon by ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Next and previous Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve next and previous Pokémon.' })
    async getNextPrev(@Param('id') id: string) {
        return await this.pokemonService.getNextPrev(parseInt(id));
    }

    @Get('evotree/:id')
    @ApiOperation({ summary: 'Get Pokémon evolution tree by ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon evolution tree retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon evolution tree.' })
    async getEvoTree(@Param('id') id: string) {
        return await this.pokemonService.getEvoTree(parseInt(id));
    }
    
    @Get('item/sprite/:name')
    @ApiOperation({ summary: 'Get item sprite by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Item sprite retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve item sprite.' })
    async getItemSprite(@Param('name') name: string) {
        return await this.pokemonService.getItemSprite(name);
    }
    
    @Get('search/species/:name')
    @ApiOperation({ summary: 'Get Pokémon by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemonByName(@Param('name') name: string) {
        return await this.pokemonService.searchPokemonByName(name);
    }

    @Get('registries/:uuid')
    @ApiOperation({ summary: 'Get Pokédex registries by UUID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokédex registries retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokédex registries.' })
    async getPokedexRegistries(@Param('uuid') uuid: string) {
        return await this.pokemonService.getRegistries(uuid);
    }

    @Get('pokedex-status/:uuid')
    @ApiOperation({ summary: 'Get detailed Pokédex status for a player' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Detailed Pokédex status retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve detailed Pokédex status.' })
    async getDetailedPokedexStatus(@Param('uuid') uuid: string) {
        return await this.pokemonService.getDetailedPokedexStatus(uuid);
    }
    
    @Get('wordle')
    @ApiOperation({ summary: 'Get Pokémon Wordle data' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon Wordle data retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon Wordle data.' })
    async getWordle() {
        return await this.pokemonService.getWordleData();
    }

    @Post('registry')
    @ApiOperation({ summary: 'Register Pokémon' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon registered successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to register Pokémon.' })
    async registerPokemon(@Body() body: { uuid: string, pokemonId: number, form: string, palette: string, status: number }) {
        return await this.pokemonService.registerPokemon(body.uuid, body.pokemonId, body.form, body.palette, body.status);
    }

    @Post('updateDex')
    @ApiOperation({ summary: 'Update Pokémon Dex in bulk' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon Dex updated successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update Pokémon Dex.' })
    async updateDex(@Body() { uuid }: { uuid: string }) {
        // Get data from WingullService instead of directly from API
        const data = await this.wingullService.updateDex(uuid);
        
        // Process the data with our service
        const result = await this.pokemonService.updateDex(uuid, data);
        
        return {
            ...result,
            apiData: data
        };
    }

    @Get('abilities')
    @ApiOperation({ summary: 'Get all Pokémon abilities with counts' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Abilities retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve abilities.' })
    async getAllAbilities() {
        return await this.pokemonService.getAllAbilities();
    }

    @Get('ability/:name')
    @ApiOperation({ summary: 'Get ability by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Ability retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve ability.' })
    async getAbility(@Param('name') name: string) {
        return await this.pokemonService.getAbility(name);
    }

    @Get('ability/:name/pokemon')
    @ApiOperation({ summary: 'Get Pokémon by ability name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemonByAbility(@Param('name') name: string) {
        return await this.pokemonService.getPokemonByAbility(name);
    }

    @Get('showdown/teras')
    @ApiOperation({ summary: 'Get all Teras Pokemon (dex > 1025) in Showdown format' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Teras Pokemon data retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Teras Pokemon data.' })
    async getTerasPokemonShowdownData() {
        return await this.pokemonShowdownService.getTerasPokemonShowdownData();
    }

    @Get('sprite-manifest')
    @ApiOperation({ summary: 'Get the sprite manifest' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Sprite manifest retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve sprite manifest.' })
    async getSpriteManifest() {
        return this.spriteManifestService.getManifest();
    }

    @Post('sprite-manifest/refresh')
    @ApiOperation({ summary: 'Refresh the sprite manifest' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Sprite manifest refreshed successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to refresh sprite manifest.' })
    async refreshSpriteManifest() {
        await this.spriteManifestService.refreshManifest();
        const manifest = this.spriteManifestService.getManifest();
        return { count: manifest.count };
    }

    @Get('pmd/:name')
    @ApiOperation({ summary: 'Get Pokémon by PMD name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemonByPMD(@Param('name') name: string) {
        return await this.pokemonService.getPmdPortrait(name);
    }   
    /*
    @Get('overallscoreranking')
    @ApiOperation({ summary: 'Get overall score ranking' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Overall score ranking retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve overall score ranking.' })
    async getOverallScoreRanking() {
        const action = 'get overall score ranking';
        try {
            this.responseService.logRequest(action, null);
            const ranking = await this.pokemonService.getOverallRanking();
            this.responseService.logSuccess(action, ranking);
            return this.responseService.createSuccessResponse('Overall score ranking retrieved successfully', ranking);
        } catch (error) {
            this.responseService.handleError(action, error);
        }
    }
    
    @Get('dexMany/:dex')
    @ApiOperation({ summary: 'Get multiple Pokémon by Dex numbers' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemonByDexMany(@Param('dex') dex: string) {
        const action = 'get multiple Pokémon by Dex numbers';
        try {
            this.responseService.logRequest(action, { dex });
            const dexArray = dex.split(',').map(Number);
            const pokemon = await this.pokemonService.getManyPokemonByDex(dexArray);
            this.responseService.logSuccess(action, pokemon);
            return this.responseService.createSuccessResponse('Pokémon retrieved successfully', pokemon);
        } catch (error) {
            this.responseService.handleError(action, error, { dex });
        }
    }
    
    
    @Get('nameforms')
    @ApiOperation({ summary: 'Get species by name with form' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Species by name with form retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve species by name with form.' })
    async getSpeciesByNameWithForm() {
        const action = 'get species by name with form';
        try {
            this.responseService.logRequest(action, null);
            const species = await this.pokemonService.getSpeciesByNameWithForm();
            this.responseService.logSuccess(action, species);
            return this.responseService.createSuccessResponse('Species by name with form retrieved successfully', species);
        } catch (error) {
            this.responseService.handleError(action, error);
        }
    }
    
    @Get('forms')
    @ApiOperation({ summary: 'Get Pokémon by form' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon by form retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon by form.' })
    async getForms() {
        const action = 'get Pokémon by form';
        try {
            this.responseService.logRequest(action, null);
            const forms = await this.pokemonService.getPokemonByForm();
            this.responseService.logSuccess(action, forms);
            return this.responseService.createSuccessResponse('Pokémon by form retrieved successfully', forms);
        } catch (error) {
            this.responseService.handleError(action, error);
        }
    }
    
    @Get('palettes')
    @ApiOperation({ summary: 'Get Pokémon by palette' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon by palette retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon by palette.' })
    async getPalettes() {
        const action = 'get Pokémon by palette';
        try {
            this.responseService.logRequest(action, null);
            const palettes = await this.pokemonService.getPokemonByPalette();
            this.responseService.logSuccess(action, palettes);
            return this.responseService.createSuccessResponse('Pokémon by palette retrieved successfully', palettes);
        } catch (error) {
            this.responseService.handleError(action, error);
        }
    }
    
    @Get('types')
    @ApiOperation({ summary: 'Get Pokémon by type' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon by type retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon by type.' })
    async getTypes() {
        const action = 'get Pokémon by type';
        try {
            this.responseService.logRequest(action, null);
            const types = await this.pokemonService.getPokemonByType();
            this.responseService.logSuccess(action, types);
            return this.responseService.createSuccessResponse('Pokémon by type retrieved successfully', types);
        } catch (error) {
            this.responseService.handleError(action, error);
        }
    }
    
    
    @Get('eggGroups')
    @ApiOperation({ summary: 'Get Pokémon by egg group' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon by egg group retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon by egg group.' })
    async getEggGroups() {
        const action = 'get Pokémon by egg group';
        try {
            this.responseService.logRequest(action, null);
            const eggGroups = await this.pokemonService.getPokemonByEggGroup();
            this.responseService.logSuccess(action, eggGroups);
            return this.responseService.createSuccessResponse('Pokémon by egg group retrieved successfully', eggGroups);
        } catch (error) {
            this.responseService.handleError(action, error);
        }
    }
    
    @Get('abilities')
    @ApiOperation({ summary: 'Get Pokémon by ability' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon by ability retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon by ability.' })
    async getAbilities() {
        const action = 'get Pokémon by ability';
        try {
            this.responseService.logRequest(action, null);
            const abilities = await this.pokemonService.getPokemonByAbility();
            this.responseService.logSuccess(action, abilities);
            return this.responseService.createSuccessResponse('Pokémon by ability retrieved successfully', abilities);
        } catch (error) {
            this.responseService.handleError(action, error);
        }
    }
    
    @Get('count')
    @ApiOperation({ summary: 'Count all Pokémon' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon count retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon count.' })
    async countPokemon() {
        const action = 'count all Pokémon';
        try {
            this.responseService.logRequest(action, null);
            const count = await this.pokemonService.countPokemon();
            this.responseService.logSuccess(action, count);
            return this.responseService.createSuccessResponse('Pokémon count retrieved successfully', count);
        } catch (error) {
            this.responseService.handleError(action, error);
        }
    }
    

    
    
    @Get('stats/:name')
    @ApiOperation({ summary: 'Get Pokémon stats by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon stats retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon stats.' })
    async getStatsByName(@Param('name') name: string) {
        const action = 'get Pokémon stats by name';
        try {
            this.responseService.logRequest(action, { name });
            const stats = await this.pokemonService.getStatsByName(name);
            this.responseService.logSuccess(action, stats);
            return this.responseService.createSuccessResponse('Pokémon stats retrieved successfully', stats);
        } catch (error) {
            this.responseService.handleError(action, error, { name });
        }
    }
    
    @Get('sheet/:name')
    @ApiOperation({ summary: 'Get Pokémon data from Google Sheets by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon data retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon data.' })
    async getSheet(@Param('name') name: string) {
        const action = 'get Pokémon data from Google Sheets by name';
        try {
            this.responseService.logRequest(action, { name });
            const sheetData = await this.pokemonService.getFromGoogleSheets(name);
            this.responseService.logSuccess(action, sheetData);
            return this.responseService.createSuccessResponse('Pokémon data retrieved successfully', sheetData);
        } catch (error) {
            this.responseService.handleError(action, error, { name });
        }
    }
    

    @Get('moves')
    @ApiOperation({ summary: 'Get all Pokémon moves' })
    @ApiResponse({ status: HttpStatus.OK, description: 'All Pokémon moves retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve all Pokémon moves.' })
    async getAllMoves() {
        const action = 'get all Pokémon moves';
        try {
            this.responseService.logRequest(action, null);
            const moves = await this.pokemonService.getAllMoves();
            this.responseService.logSuccess(action, moves);
            return this.responseService.createSuccessResponse('All Pokémon moves retrieved successfully', moves);
        } catch (error) {
            this.responseService.handleError(action, error);
        }
    }

    

    
    
    @Get('allspawns/:name')
    @ApiOperation({ summary: 'Get all spawns by Pokémon name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'All spawns retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve all spawns.' })
    async getAllSpawns(@Param('name') name: string) {
        const action = 'get all spawns by Pokémon name';
        try {
            this.responseService.logRequest(action, { name });
            const spawns = await this.pokemonService.getAllSpawnsByPokemon(name);
            this.responseService.logSuccess(action, spawns);
            return this.responseService.createSuccessResponse('All spawns retrieved successfully', spawns);
        } catch (error) {
            this.responseService.handleError(action, error, { name });
        }
    }
    

    
    @Get('sprite/:id/:form/:palette/:uuid/:hide')
    @ApiOperation({ summary: 'Get Pokémon sprite' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Sprite retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve sprite.' })
    async getSprite(
        @Param('id') pokemonId: number,
        @Param('form') formName: string,
        @Param('palette') paletteName: string,
        @Param('uuid') uuid: string,
        @Param('hide') hide: number,
    ) {
        const action = 'get Pokémon sprite';
        try {
            this.responseService.logRequest(action, { pokemonId, formName, paletteName, uuid, hide });
            const sprite = await this.pokemonService.getImage({ pokemonId, formName, paletteName, uuid, type: 'sprite', hide });
            this.responseService.logSuccess(action, sprite);
            return this.responseService.createSuccessResponse('Sprite retrieved successfully', sprite);
        } catch (error) {
            this.responseService.handleError(action, error, { pokemonId, formName, paletteName, uuid, hide });
        }
    }
    
    @Get('pokemonnamepalette')
    @ApiOperation({ summary: 'Get Pokémon name palette' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon name palette retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon name palette.' })
    async getPokemonNamePalette() {
        const action = 'get Pokémon name palette';
        try {
            this.responseService.logRequest(action, null);
            const palette = await this.pokemonService.getPokemonNamePalette();
            this.responseService.logSuccess(action, palette);
            return this.responseService.createSuccessResponse('Pokémon name palette retrieved successfully', palette);
        } catch (error) {
            this.responseService.handleError(action, error);
        }
    }
    

    
    

    }*/
}