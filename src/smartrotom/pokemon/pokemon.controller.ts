import { Body, Controller, Get, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { ResponseService } from '@/response/response.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('smartrotom/pokemon')
@Controller('smartrotom/pokemon')
export class PokemonController {  
    private readonly logger = new Logger(PokemonController.name);
    
    constructor(
        private readonly pokemonService: PokemonService,
        private readonly responseService: ResponseService,
    ) {}
    
    
    @Get()
    @ApiOperation({ summary: 'Get all Pokémon' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemon() {
        const action = 'get all Pokémon';
        try {
            this.responseService.logRequest(action, null);
            const pokemon = await this.pokemonService.getPokemon();
            this.responseService.logSuccess(action, pokemon);
            return this.responseService.createSuccessResponse('Pokémon retrieved successfully', pokemon);
        } catch (error) {
            this.responseService.handleError(action, error);
        }
    }
    
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
    
    @Get('dex/:dex')
    @ApiOperation({ summary: 'Get Pokémon by Dex number' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemonByDex(@Param('dex') dex: number) {
        const action = 'get Pokémon by Dex number';
        try {
            this.responseService.logRequest(action, { dex });
            const pokemon = await this.pokemonService.getPokemonByDex(dex);
            this.responseService.logSuccess(action, pokemon);
            return this.responseService.createSuccessResponse('Pokémon retrieved successfully', pokemon);
        } catch (error) {
            this.responseService.handleError(action, error, { dex });
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
    
    @Get('names')
    @ApiOperation({ summary: 'Get Pokémon names' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon names retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon names.' })
    async getPokemonNames() {
        const action = 'get Pokémon names';
        try {
            this.responseService.logRequest(action, null);
            const names = await this.pokemonService.getPokemonNames();
            this.responseService.logSuccess(action, names);
            return this.responseService.createSuccessResponse('Pokémon names retrieved successfully', names);
        } catch (error) {
            this.responseService.handleError(action, error);
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
    
    @Get('nextprev/:id')
    @ApiOperation({ summary: 'Get next and previous Pokémon by ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Next and previous Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve next and previous Pokémon.' })
    async getNextPrev(@Param('id') id: string) {
        const action = 'get next and previous Pokémon by ID';
        try {
            this.responseService.logRequest(action, { id });
            const nextPrev = await this.pokemonService.getNextPrev(parseInt(id));
            this.responseService.logSuccess(action, nextPrev);
            return this.responseService.createSuccessResponse('Next and previous Pokémon retrieved successfully', nextPrev);
        } catch (error) {
            this.responseService.handleError(action, error, { id });
        }
    }
    
    @Get('search/species/:name')
    @ApiOperation({ summary: 'Get Pokémon by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemonByName(@Param('name') name: string) {
        const action = 'get Pokémon by name';
        try {
            this.responseService.logRequest(action, { name });
            const pokemon = await this.pokemonService.getPokemonByName(name);
            this.responseService.logSuccess(action, pokemon);
            return this.responseService.createSuccessResponse('Pokémon retrieved successfully', pokemon);
        } catch (error) {
            this.responseService.handleError(action, error, { name });
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
    
    @Get('evotree/:id')
    @ApiOperation({ summary: 'Get Pokémon evolution tree by ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon evolution tree retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon evolution tree.' })
    async getEvoTree(@Param('id') id: string) {
        const action = 'get Pokémon evolution tree by ID';
        try {
            this.responseService.logRequest(action, { id });
            const evoTree = await this.pokemonService.getEvoTree(parseInt(id));
            this.responseService.logSuccess(action, evoTree);
            return this.responseService.createSuccessResponse('Pokémon evolution tree retrieved successfully', evoTree);
        } catch (error) {
            this.responseService.handleError(action, error, { id });
        }
    }
    
    @Get('moves/:id/:form')
    @ApiOperation({ summary: 'Get Pokémon moves by ID and form' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon moves retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon moves.' })
    async getMoves(@Param('id') id: number, @Param('form') form: number) {
        const action = 'get Pokémon moves by ID and form';
        try {
            this.responseService.logRequest(action, { id, form });
            const moves = await this.pokemonService.getMoves(id, form);
            this.responseService.logSuccess(action, moves);
            return this.responseService.createSuccessResponse('Pokémon moves retrieved successfully', moves);
        } catch (error) {
            this.responseService.handleError(action, error, { id, form });
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
    @Get('move/:name')
    @ApiOperation({ summary: 'Get move by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Move retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve move.' })
    async getMove(@Param('name') name: string) {
        const action = 'get move by name';
        try {
            this.responseService.logRequest(action, { name });
            const move = await this.pokemonService.getMove(name);
            this.responseService.logSuccess(action, move);
            return this.responseService.createSuccessResponse('Move retrieved successfully', move);
        } catch (error) {
            this.responseService.handleError(action, error, { name });
        }
    }
    
    @Get('move/:name/pokemon')
    @ApiOperation({ summary: 'Get Pokémon by move name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemonByMove(@Param('name') name: string) {
        const action = 'get Pokémon by move name';
        try {
            this.responseService.logRequest(action, { name });
            const pokemon = await this.pokemonService.getPokemonByMove(name);
            this.responseService.logSuccess(action, pokemon);
            return this.responseService.createSuccessResponse('Pokémon retrieved successfully', pokemon);
        } catch (error) {
            this.responseService.handleError(action, error, { name });
        }
    }
    
    @Get('spawns/:name')
    @ApiOperation({ summary: 'Get spawns by Pokémon name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Spawns retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve spawns.' })
    async getSpawns(@Param('name') name: string) {
        const action = 'get spawns by Pokémon name';
        try {
            this.responseService.logRequest(action, { name });
            const spawns = await this.pokemonService.getSpawns(name);
            this.responseService.logSuccess(action, spawns);
            return this.responseService.createSuccessResponse('Spawns retrieved successfully', spawns);
        } catch (error) {
            this.responseService.handleError(action, error, { name });
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
        const action = 'get Pokémon image';
        try {
            this.responseService.logRequest(action, { pokemonId, formName, paletteName, uuid, hide });
            const image = await this.pokemonService.getImage({ pokemonId, formName, paletteName, uuid, hide });
            this.responseService.logSuccess(action, image);
            return this.responseService.createSuccessResponse('Image retrieved successfully', image);
        } catch (error) {
            this.responseService.handleError(action, error, { pokemonId, formName, paletteName, uuid, hide });
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
    
    @Get('item/sprite/:name')
    @ApiOperation({ summary: 'Get item sprite by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Item sprite retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve item sprite.' })
    async getItemSprite(@Param('name') name: string) {
        const action = 'get item sprite by name';
        try {
            this.responseService.logRequest(action, { name });
            const sprite = await this.pokemonService.getItemSprite(name);
            this.responseService.logSuccess(action, sprite);
            return this.responseService.createSuccessResponse('Item sprite retrieved successfully', sprite);
        } catch (error) {
            this.responseService.handleError(action, error, { name });
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
    
    @Post('registry')
    @ApiOperation({ summary: 'Register Pokémon' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon registered successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to register Pokémon.' })
    async registerPokemon(@Body() body: { uuid: string, pokemonId: number, form: string, palette: string, status: number }) {
        const action = 'register Pokémon';
        try {
            this.responseService.logRequest(action, body);
            const result = await this.pokemonService.registerPokemon(body.uuid, body.pokemonId, body.form, body.palette, body.status);
            this.responseService.logSuccess(action, result);
            return this.responseService.createSuccessResponse('Pokémon registered successfully', result);
        } catch (error) {
            this.responseService.handleError(action, error, body);
        }
    }
    
    @Get('pokedex/:uuid')
    @ApiOperation({ summary: 'Get Pokédex registry by UUID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokédex registry retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokédex registry.' })
    async getPokedexRegistry(@Param('uuid') uuid: string) {
        const action = 'get Pokédex registry by UUID';
        try {
            this.responseService.logRequest(action, { uuid });
            const registry = await this.pokemonService.getPokedex(uuid);
            this.responseService.logSuccess(action, registry);
            return this.responseService.createSuccessResponse('Pokédex registry retrieved successfully', registry);
        } catch (error) {
            this.responseService.handleError(action, error, { uuid });
        }
    }
    
    
    @Get('registries/:uuid')
    @ApiOperation({ summary: 'Get Pokédex registries by UUID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokédex registries retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokédex registries.' })
    async getPokedexRegistries(@Param('uuid') uuid: string) {
        const action = 'get Pokédex registries by UUID';
        try {
            this.responseService.logRequest(action, { uuid });
            const registries = await this.pokemonService.getRegistries(uuid);
            this.responseService.logSuccess(action, registries);
            return this.responseService.createSuccessResponse('Pokédex registries retrieved successfully', registries);
        } catch (error) {
            this.responseService.handleError(action, error, { uuid });
        }
    }
    
    @Get('biome/:name')
    @ApiOperation({ summary: 'Get Pokémon by biome name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemonByBiome(@Param('name') name: string) {
        const action = 'get Pokémon by biome name';
        try {
            this.responseService.logRequest(action, { name });
            const pokemon = await this.pokemonService.getPokemonByBiome(name);
            this.responseService.logSuccess(action, pokemon);
            return this.responseService.createSuccessResponse('Pokémon retrieved successfully', pokemon);
        } catch (error) {
            this.responseService.handleError(action, error, { name });
        }
    }
    
    @Get('biomes')
    @ApiOperation({ summary: 'Get all biomes' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Biomes retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve biomes.' })
    async getBiomes() {
        const action = 'get all biomes';
        try {
            this.responseService.logRequest(action, null);
            const biomes = await this.pokemonService.getBiomes();
            this.responseService.logSuccess(action, biomes);
            return this.responseService.createSuccessResponse('Biomes retrieved successfully', biomes);
        } catch (error) {
            this.responseService.handleError(action, error);
        }
    }
    
    @Get('pmd/:name')
    @ApiOperation({ summary: 'Get Pokémon by PMD name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemonByPMD(@Param('name') name: string) {
        const action = 'get Pokémon by PMD name';
        try {
            this.responseService.logRequest(action, { name });
            const pokemon = await this.pokemonService.getPmdSprite(name);
            this.responseService.logSuccess(action, pokemon);
            return this.responseService.createSuccessResponse('Pokémon retrieved successfully', pokemon);
        } catch (error) {
            this.responseService.handleError(action, error, { name });
        }
    }
    
    @Get('wordle')
    @ApiOperation({ summary: 'Get Pokémon Wordle data' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon Wordle data retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon Wordle data.' })
    async getWordle() {
        const action = 'get Pokémon Wordle data';
        try {
            this.responseService.logRequest(action, null);
            const wordleData = await this.pokemonService.getPokemonWordleData();
            this.responseService.logSuccess(action, wordleData);
            return this.responseService.createSuccessResponse('Pokémon Wordle data retrieved successfully', wordleData);
        } catch (error) {
            this.responseService.handleError(action, error);
        }
    }
    
}
