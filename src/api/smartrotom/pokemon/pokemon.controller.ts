import { Controller, Get, Post, Body, Param, Query, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { PokemonFacadeService } from './pokemon.facade.service';

@ApiTags('SmartRotom | Pokémon')
@Controller('smartrotom/pokemon')
@UseInterceptors(ResponseInterceptor)
export class PokemonController {  
    constructor(
        private readonly pokemonFacadeService: PokemonFacadeService,
    ) {}
    
    // ==================== BASIC POKEMON OPERATIONS ====================
    
    @Get()
    @ApiOperation({ summary: 'Get all Pokémon' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    async getPokemon() {
        return this.pokemonFacadeService.getAllPokemon();
    }

    @Get('dex/:dex')
    @ApiOperation({ summary: 'Get Pokémon by Dex number' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pokémon not found.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    @ApiParam({ name: 'dex', description: 'Pokédex number' })
    async getPokemonByDex(@Param('dex') dex: number) {
        const pokemon = this.pokemonFacadeService.getPokemonByDex(dex);
        if (!pokemon) {
            throw new Error('Pokémon not found');
        }
        return pokemon;
    }

    @Get('names')
    @ApiOperation({ summary: 'Get Pokémon names' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon names retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon names.' })
    async getPokemonNames() {
        return this.pokemonFacadeService.getPokemonNames();
    }
    
    @Get('search/species/:name')
    @ApiOperation({ summary: 'Get Pokémon by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pokémon not found.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    @ApiParam({ name: 'name', description: 'Pokémon name' })
    async getPokemonByName(@Param('name') name: string) {
        const pokemon = this.pokemonFacadeService.getPokemonByName(name);
        if (!pokemon) {
            throw new Error('Pokémon not found');
        }
        return pokemon;
    }

    @Get('search/:name')
    @ApiOperation({ summary: 'Search Pokémon by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Search results retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to search Pokémon.' })
    @ApiParam({ name: 'name', description: 'Search term' })
    @ApiQuery({ name: 'amount', description: 'Number of results to return', required: false })
    async searchPokemon(@Param('name') name: string, @Query('amount') amount?: string) {
        const limit = amount ? parseInt(amount, 10) : 16;
        return this.pokemonFacadeService.searchPokemonByName(name, limit);
    }

    @Get('nextprev/:id')
    @ApiOperation({ summary: 'Get next and previous Pokémon by ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Next and previous Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve next and previous Pokémon.' })
    @ApiParam({ name: 'id', description: 'Pokémon ID' })
    async getNextPrev(@Param('id') id: string) {
        return this.pokemonFacadeService.getNextPrev(+id);
    }

    @Get('evotree/:id')
    @ApiOperation({ summary: 'Get Pokémon evolution tree by ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon evolution tree retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon evolution tree.' })
    @ApiParam({ name: 'id', description: 'Pokémon ID' })
    async getEvoTree(@Param('id') id: string) {
        return this.pokemonFacadeService.getEvoTree(+id);
    }

    // ==================== MOVE OPERATIONS ====================

    @Get('moves')
    @ApiOperation({ summary: 'Get all Pokémon moves, and how many Pokémon learn them' })
    @ApiResponse({ status: HttpStatus.OK, description: 'All Pokémon moves retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve all Pokémon moves.' })
    async getAllMoves() {
        return this.pokemonFacadeService.getAllMoves();
    }

    @Get('moves/:id/:form')
    @ApiOperation({ summary: 'Get Pokémon moves by ID and form' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon moves retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon moves.' })
    @ApiParam({ name: 'id', description: 'Pokémon ID' })
    @ApiParam({ name: 'form', description: 'Form index' })
    async getMoves(@Param('id') id: number, @Param('form') form: number) {
        return this.pokemonFacadeService.getPokemonMoves(id, form);
    }

    @Get('move/:name')
    @ApiOperation({ summary: 'Get move by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Move retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Move not found.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve move.' })
    @ApiParam({ name: 'name', description: 'Move name' })
    async getMove(@Param('name') name: string) {
        const move = this.pokemonFacadeService.getMove(name);
        if (!move) {
            throw new Error('Move not found');
        }
        return move;
    }

    @Get('move/:name/pokemon')
    @ApiOperation({ summary: 'Get Pokémon by move name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    @ApiParam({ name: 'name', description: 'Move name' })
    async getPokemonByMove(@Param('name') name: string) {
        return this.pokemonFacadeService.getPokemonByMove(name);
    }

    // ==================== ABILITY OPERATIONS ====================

    @Get('abilities')
    @ApiOperation({ summary: 'Get all Pokémon abilities with counts' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Abilities retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve abilities.' })
    async getAllAbilities() {
        return this.pokemonFacadeService.getAllAbilities();
    }

    @Get('ability/:name')
    @ApiOperation({ summary: 'Get ability by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Ability retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ability not found.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve ability.' })
    @ApiParam({ name: 'name', description: 'Ability name' })
    async getAbility(@Param('name') name: string) {
        return this.pokemonFacadeService.getAbility(name);
    }

    @Get('ability/:name/pokemon')
    @ApiOperation({ summary: 'Get Pokémon by ability name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    @ApiParam({ name: 'name', description: 'Ability name' })
    async getPokemonByAbility(@Param('name') name: string) {
        return this.pokemonFacadeService.getPokemonByAbility(name);
    }

    // ==================== SPAWN OPERATIONS ====================
    
    @Get('spawns/:name')
    @ApiOperation({ summary: 'Get spawns by Pokémon name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Spawns retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve spawns.' })
    @ApiParam({ name: 'name', description: 'Pokémon name' })
    async getSpawns(@Param('name') name: string) {
        return this.pokemonFacadeService.getSpawnByPokemon(name);
    }
    
    @Get('biomes')
    @ApiOperation({ summary: 'Get all biomes' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Biomes retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve biomes.' })
    async getBiomes() {
        return this.pokemonFacadeService.getBiomes();
    }
    
    @Get('biome/:name')
    @ApiOperation({ summary: 'Get Pokémon by biome name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon.' })
    @ApiParam({ name: 'name', description: 'Biome name' })
    async getPokemonByBiome(@Param('name') name: string) {
        return this.pokemonFacadeService.getPokemonByBiome(name);
    }

    @Get('biomes/:name')
    @ApiOperation({ summary: 'Get biomes by Pokémon name and form' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Biomes retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve biomes.' })
    @ApiParam({ name: 'name', description: 'Pokémon name' })
    async getBiomesByPokemon(@Param('name') name: string) {
        return this.pokemonFacadeService.getBiomesByPokemon(name);
    }

    // ==================== IMAGE OPERATIONS ====================

    @Get('image/:pokemonId/:formName/:paletteName/:uuid')
    @ApiOperation({ summary: 'Get Pokémon image' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Image retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Image not found.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve image.' })
    @ApiParam({ name: 'pokemonId', description: 'Pokémon ID' })
    @ApiParam({ name: 'formName', description: 'Form name' })
    @ApiParam({ name: 'paletteName', description: 'Palette name' })
    @ApiParam({ name: 'uuid', description: 'User UUID' })
    @ApiQuery({ name: 'type', description: 'Image type', required: false })
    @ApiQuery({ name: 'hide', description: 'Hide parameter', required: false })
    async getImage(
        @Param('pokemonId') pokemonId: string,
        @Param('formName') formName: string,
        @Param('paletteName') paletteName: string,
        @Param('uuid') uuid: string,
        @Query('type') type?: string,
        @Query('hide') hide?: string
    ) {
        return await this.pokemonFacadeService.getImage({
            pokemonId: pokemonId ? +pokemonId : undefined,
            formName,
            paletteName,
            uuid,
            type,
            hide: hide ? +hide : undefined
        });
    }

    @Get('sprite/item/:name')
    @ApiOperation({ summary: 'Get item sprite by name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Item sprite retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item sprite not found.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve item sprite.' })
    @ApiParam({ name: 'name', description: 'Item name' })
    async getItemSprite(@Param('name') name: string) {
        return this.pokemonFacadeService.getItemSprite(name);
    }

    // ==================== POKEDEX OPERATIONS ====================

    @Post('register')
    @ApiOperation({ summary: 'Register a Pokémon encounter' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon registered successfully.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid registration data.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to register Pokémon.' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                uuid: { type: 'string', description: 'User UUID' },
                pokemonId: { type: 'number', description: 'Pokémon ID' },
                form: { type: 'string', description: 'Form name' },
                palette: { type: 'string', description: 'Palette name' },
                status: { type: 'number', description: 'Status (0=seen, 1=caught)' }
            },
            required: ['uuid', 'pokemonId', 'form', 'palette', 'status']
        }
    })
    async registerPokemon(@Body() body: {
        uuid: string;
        pokemonId: number;
        form: string;
        palette: string;
        status: number;
    }) {
        return await this.pokemonFacadeService.registerPokemon(
            body.uuid,
            body.pokemonId,
            body.form,
            body.palette,
            body.status
        );
    }

    @Post('dex/update')
    @ApiOperation({ summary: 'Bulk update Pokédex' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokédex updated successfully.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid update data.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update Pokédex.' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                uuid: { type: 'string', description: 'User UUID' },
                SEEN: { type: 'array', items: { type: 'number' }, description: 'Array of seen Pokémon IDs' },
                CAUGHT: { type: 'array', items: { type: 'number' }, description: 'Array of caught Pokémon IDs' }
            },
            required: ['uuid', 'SEEN', 'CAUGHT']
        }
    })
    async updateDex(@Body() body: {
        uuid: string;
        SEEN: number[];
        CAUGHT: number[];
    }) {
        return await this.pokemonFacadeService.updateDex(body.uuid, {
            SEEN: body.SEEN,
            CAUGHT: body.CAUGHT
        });
    }

    @Get('dex/stats/:uuid')
    @ApiOperation({ summary: 'Get Pokédex statistics for user' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokédex statistics retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokédex statistics.' })
    @ApiParam({ name: 'uuid', description: 'User UUID' })
    async getPokedexStats(@Param('uuid') uuid: string) {
        return await this.pokemonFacadeService.getPokedexStatistics(uuid);
    }

    @Get('dex/detailed/:uuid')
    @ApiOperation({ summary: 'Get detailed Pokédex status for user' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Detailed Pokédex status retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve detailed Pokédex status.' })
    @ApiParam({ name: 'uuid', description: 'User UUID' })
    async getDetailedPokedexStatus(@Param('uuid') uuid: string) {
        return await this.pokemonFacadeService.getDetailedPokedexStatus(uuid);
    }

    @Get('dex/registries/:uuid')
    @ApiOperation({ summary: 'Get Pokédex registries for user' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokédex registries retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokédex registries.' })
    @ApiParam({ name: 'uuid', description: 'User UUID' })
    async getPokedexRegistries(@Param('uuid') uuid: string) {
        return await this.pokemonFacadeService.getPokedexRegistries(uuid);
    }

    // ==================== INTEGRATION OPERATIONS ====================

    @Get('showdown/teras')
    @ApiOperation({ summary: 'Get Teras Pokémon Showdown data' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Showdown data retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Showdown data.' })
    async getTerasShowdownData() {
        return await this.pokemonFacadeService.getTerasPokemonShowdownData();
    }

    // ==================== UTILITY OPERATIONS ====================

    @Get('wordle')
    @ApiOperation({ summary: 'Get Pokémon Wordle data' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Wordle data retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Wordle data.' })
    async getWordleData() {
        return this.pokemonFacadeService.getWordleData();
    }

    @Get('sprites/manifest')
    @ApiOperation({ summary: 'Get sprite manifest' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Sprite manifest retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve sprite manifest.' })
    async getSpriteManifest() {
        return this.pokemonFacadeService.getSpriteManifest();
    }

    @Post('sprites/refresh')
    @ApiOperation({ summary: 'Refresh sprite manifest' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Sprite manifest refreshed successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to refresh sprite manifest.' })
    async refreshSpriteManifest() {
        await this.pokemonFacadeService.refreshSpriteManifest();
        return { message: 'Sprite manifest refreshed successfully' };
    }

    @Get('pmd/portrait/:name')
    @ApiOperation({ summary: 'Get PMD portrait by Pokémon name' })
    @ApiResponse({ status: HttpStatus.OK, description: 'PMD portrait retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Portrait not found.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve PMD portrait.' })
    @ApiParam({ name: 'name', description: 'Pokémon name' })
    async getPmdPortrait(@Param('name') name: string) {
        return await this.pokemonFacadeService.getPmdPortrait(name);
    }

    @Get('count')
    @ApiOperation({ summary: 'Get total Pokémon count' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Pokémon count retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Pokémon count.' })
    async getPokemonCount() {
        return { count: this.pokemonFacadeService.countPokemon() };
    }
}