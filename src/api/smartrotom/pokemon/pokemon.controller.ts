import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  HttpStatus, 
  UseInterceptors,
  UsePipes,
  ValidationPipe 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery, 
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiExtraModels
} from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { PokemonFacadeService } from './pokemon.facade.service';

// Import DTOs
import { GetPokemonByDexDto, SearchPokemonDto, GetPokemonMovesDto } from './dto/get-pokemon.dto';
import { GetPokemonImageDto } from './dto/get-pokemon-image.dto';
import { RegisterPokemonDto } from './dto/register-pokemon.dto';
import { UpdateDexDto } from './dto/update-dex.dto';

// Import Response Entities
import { Pokemon } from './entities/pokemon.entity';
import { PokemonSearchResult } from './entities/pokemon-search.entity';
import { PokemonLearnset, Move, MoveCount, FullMove, PokemonMoveEntry } from './entities/pokemon-move.entity';
import { AbilityCount, AbilityInfo, PokemonAbilityEntry } from './entities/pokemon-ability.entity';
import { SpawnInfo, BiomeSpawnData } from './entities/pokemon-spawn.entity';
import { PokemonImage, ItemSprite } from './entities/pokemon-image.entity';
import { PokedexStatistics, DetailedPokedexStatistics, PokedexRegistry } from './entities/pokedex.entity';
import { EvolutionNode, EvolutionTree } from './entities/pokemon-evolution-tree';
import { BiomeSpawnCollection } from './entities/biome-spawn-collection.entity';
import { PokemonBiomes } from './entities/pokemon-biomes';

@ApiTags('SmartRotom | Pokémon')
@Controller('smartrotom/pokemon')
@UseInterceptors(ResponseInterceptor)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PokemonController {  
    constructor(
        private readonly pokemonFacadeService: PokemonFacadeService,
    ) {}
    
    // ==================== BASIC POKEMON OPERATIONS ====================
    
    @Get()
    @ApiOperation({ summary: 'Get all Pokémon' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokémon retrieved successfully.',
      type: [Pokemon]
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Pokémon.' })
    async getPokemon(): Promise<Pokemon[]> {
        return this.pokemonFacadeService.getAllPokemon();
    }

    @Get('dex/:dex')
    @ApiOperation({ summary: 'Get Pokémon by Dex number' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokémon retrieved successfully.',
      type: Pokemon
    })
    @ApiNotFoundResponse({ description: 'Pokémon not found.' })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Pokémon.' })
    @ApiParam({ name: 'dex', description: 'Pokédex number', type: Number })
    async getPokemonByDex(@Param('dex') dex: number): Promise<Pokemon> {
        const pokemon = this.pokemonFacadeService.getPokemonByDex(dex);
        if (!pokemon) {
            throw new Error('Pokémon not found');
        }
        return pokemon;
    }

    @Get('names')
    @ApiOperation({ summary: 'Get Pokémon names' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokémon names retrieved successfully.',
      schema: {
        type: 'array',
        items: { type: 'string' },
        example: ['Bulbasaur', 'Ivysaur', 'Venusaur']
      }
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Pokémon names.' })
    async getPokemonNames(): Promise<string[]> {
        return this.pokemonFacadeService.getPokemonNames();
    }
    
    @Get('search/species/:name')
    @ApiOperation({ summary: 'Get Pokémon by name' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokémon retrieved successfully.',
      type: Pokemon
    })
    @ApiNotFoundResponse({ description: 'Pokémon not found.' })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Pokémon.' })
    @ApiParam({ name: 'name', description: 'Pokémon name', example: 'Pikachu' })
    async getPokemonByName(@Param('name') name: string): Promise<Pokemon> {
        const pokemon = this.pokemonFacadeService.getPokemonByName(name);
        if (!pokemon) {
            throw new Error('Pokémon not found');
        }
        return pokemon;
    }

    @Get('search/:name')
    @ApiOperation({ summary: 'Search Pokémon by name' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Search results retrieved successfully.',
      type: [PokemonSearchResult]
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to search Pokémon.' })
    @ApiParam({ name: 'name', description: 'Search term', example: 'pika' })
    @ApiQuery({ 
      name: 'amount', 
      description: 'Number of results to return', 
      required: false,
      type: Number,
      example: 16
    })
    async searchPokemon(
      @Param('name') name: string, 
      @Query('amount') amount?: string
    ): Promise<PokemonSearchResult[]> {
        const limit = amount ? parseInt(amount, 10) : 16;
        const fuseResults = this.pokemonFacadeService.searchPokemonByName(name, limit);
        
        // Transform FuseResult to PokemonSearchResult
        return fuseResults.map(result => ({
            item: result.item,
            score: result.score ?? 0,
            refIndex: result.refIndex
        }));
    }

    @Get('nextprev/:id')
    @ApiOperation({ summary: 'Get next and previous Pokémon by ID' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Next and previous Pokémon retrieved successfully.',
      schema: {
        type: 'object',
        properties: {
          next: { $ref: '#/components/schemas/Pokemon' },
          prev: { $ref: '#/components/schemas/Pokemon' }
        }
      }
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve next and previous Pokémon.' })
    @ApiParam({ name: 'id', description: 'Pokémon ID', type: Number })
    async getNextPrev(@Param('id') id: string) {
        return this.pokemonFacadeService.getNextPrev(+id);
    }

    @Get('evotree/:id')
    @ApiOperation({ summary: 'Get Pokémon evolution tree by ID' })
    @ApiExtraModels(EvolutionNode)
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokémon evolution tree retrieved successfully.',
      type: EvolutionTree
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Pokémon evolution tree.' })
    @ApiParam({ name: 'id', description: 'Pokémon ID', type: Number })
    async getEvoTree(@Param('id') id: string): Promise<EvolutionTree> {
        return this.pokemonFacadeService.getEvoTree(+id);
    }

    // ==================== MOVE OPERATIONS ====================

    @Get('moves')
    @ApiOperation({ summary: 'Get all Pokémon moves, and how many Pokémon learn them' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'All Pokémon moves retrieved successfully.',
      type: [MoveCount]
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve all Pokémon moves.' })
    async getAllMoves(): Promise<MoveCount[]> {
        return this.pokemonFacadeService.getAllMoves();
    }

    @Get('moves/:id/:form')
    @ApiOperation({ summary: 'Get Pokémon moves by ID and form' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokémon moves retrieved successfully.',
      type: PokemonLearnset
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Pokémon moves.' })
    @ApiParam({ name: 'id', description: 'Pokémon ID', type: Number })
    @ApiParam({ name: 'form', description: 'Form index', type: Number })
    async getMoves(@Param('id') id: number, @Param('form') form: number): Promise<PokemonLearnset> {
        return this.pokemonFacadeService.getPokemonMoves(id, form);
    }

    @Get('move/:name')
    @ApiOperation({ summary: 'Get move by name' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Move retrieved successfully.',
      type: FullMove
    })
    @ApiNotFoundResponse({ description: 'Move not found.' })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve move.' })
    @ApiParam({ name: 'name', description: 'Move name', example: 'Thunderbolt' })
    async getMove(@Param('name') name: string): Promise<FullMove> {
        const move = this.pokemonFacadeService.getMove(name);
        if (!move) {
            throw new Error('Move not found');
        }
        return move;
    }

    @Get('move/:name/pokemon')
    @ApiOperation({ summary: 'Get Pokémon by move name' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokémon retrieved successfully.',
      type: [PokemonMoveEntry]
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Pokémon.' })
    @ApiParam({ name: 'name', description: 'Move name', example: 'Thunderbolt' })
    async getPokemonByMove(@Param('name') name: string): Promise<PokemonMoveEntry[]> {
        return this.pokemonFacadeService.getPokemonByMove(name);
    }

    // ==================== ABILITY OPERATIONS ====================

    @Get('abilities')
    @ApiOperation({ summary: 'Get all Pokémon abilities with counts' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Abilities retrieved successfully.',
      type: [AbilityCount]
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve abilities.' })
    async getAllAbilities(): Promise<AbilityCount[]> {
        return this.pokemonFacadeService.getAllAbilities();
    }

    @Get('ability/:name')
    @ApiOperation({ summary: 'Get ability by name' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Ability retrieved successfully.',
      type: AbilityInfo
    })
    @ApiNotFoundResponse({ description: 'Ability not found.' })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve ability.' })
    @ApiParam({ name: 'name', description: 'Ability name', example: 'Static' })
    async getAbility(@Param('name') name: string): Promise<AbilityInfo> {
        return this.pokemonFacadeService.getAbility(name);
    }

    @Get('ability/:name/pokemon')
    @ApiOperation({ summary: 'Get Pokémon by ability name' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokémon retrieved successfully.',
      type: [PokemonAbilityEntry]
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Pokémon.' })
    @ApiParam({ name: 'name', description: 'Ability name', example: 'Static' })
    async getPokemonByAbility(@Param('name') name: string): Promise<PokemonAbilityEntry[]> {
        return this.pokemonFacadeService.getPokemonByAbility(name);
    }

    // ==================== SPAWN OPERATIONS ====================
    
    @Get('spawns/:name')
    @ApiOperation({ summary: 'Get spawns by Pokémon name' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Spawns retrieved successfully.',
      type: [SpawnInfo]
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve spawns.' })
    @ApiParam({ name: 'name', description: 'Pokémon name', example: 'Pikachu' })
    async getSpawns(@Param('name') name: string): Promise<SpawnInfo[]> {
        return this.pokemonFacadeService.getSpawnByPokemon(name);
    }
    
    @Get('biomes')
    @ApiOperation({ summary: 'Get all biomes' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Biomes retrieved successfully.',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            count: { type: 'number' }
          }
        },
        example: [
          { name: 'Plains', count: 45 },
          { name: 'Forest', count: 32 },
          { name: 'Ocean', count: 28 }
        ]
      }
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve biomes.' })
    async getBiomes(): Promise<{ name: string; count: number }[]> {
        return this.pokemonFacadeService.getBiomes();
    }
    
    @Get('biome/:name')
    @ApiOperation({ summary: 'Get Pokémon by biome name' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokémon retrieved successfully.',
      type: BiomeSpawnCollection
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Pokémon.' })
    @ApiParam({ name: 'name', description: 'Biome name', example: 'Plains' })
    async getPokemonByBiome(@Param('name') name: string): Promise<BiomeSpawnCollection> {
        const result = this.pokemonFacadeService.getPokemonByBiome(name);
        return result;
    }

  @Get('biomes/:name')
  @ApiOperation({ summary: 'Get biomes by Pokémon name and form' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Biomes retrieved successfully.',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: [
        'redwoods',
        'biomesoplenty:seasonal_forest',
        'byg:seasonal_forest',
        'byg:seasonal_forest_hills',
        'biomesoplenty:burnt_forest',
        'teras:pueblo_sakura',
        'pixelmon:ultra_forest',
        'pixelmon:ultra_plant'
      ]
    }
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve biomes.' })
  @ApiParam({ 
    name: 'name', 
    description: 'Pokémon name and form (format: pokemon_form)', 
    example: 'vulpix_base' 
  })
  async getBiomesByPokemon(@Param('name') name: string): Promise<string[]> {
      return await this.pokemonFacadeService.getBiomesByPokemon(name);
  }

    // ==================== IMAGE OPERATIONS ====================

    @Get('image/:pokemonId/:formName/:paletteName/:uuid')
    @ApiOperation({ summary: 'Get Pokémon image' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Image retrieved successfully.',
      type: PokemonImage
    })
    @ApiNotFoundResponse({ description: 'Image not found.' })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve image.' })
    @ApiParam({ name: 'pokemonId', description: 'Pokémon ID', type: Number })
    @ApiParam({ name: 'formName', description: 'Form name', example: 'base' })
    @ApiParam({ name: 'paletteName', description: 'Palette name', example: 'none' })
    @ApiParam({ name: 'uuid', description: 'User UUID' })
    @ApiQuery({ 
      name: 'type', 
      description: 'Image type', 
      required: false,
      enum: ['img', 'sprite']
    })
    @ApiQuery({ 
      name: 'hide', 
      description: 'Hide parameter', 
      required: false,
      type: Number,
      enum: [0, 1]
    })
    async getImage(
        @Param('pokemonId') pokemonId: string,
        @Param('formName') formName: string,
        @Param('paletteName') paletteName: string,
        @Param('uuid') uuid: string,
        @Query('type') type?: string,
        @Query('hide') hide?: string
    ): Promise<PokemonImage> {
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
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Item sprite retrieved successfully.',
      type: ItemSprite
    })
    @ApiNotFoundResponse({ description: 'Item sprite not found.' })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve item sprite.' })
    @ApiParam({ name: 'name', description: 'Item name', example: 'pokeball' })
    async getItemSprite(@Param('name') name: string): Promise<ItemSprite> {
        return this.pokemonFacadeService.getItemSprite(name);
    }

    // ==================== POKEDEX OPERATIONS ====================

    @Post('register')
    @ApiOperation({ summary: 'Register a Pokémon encounter' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokémon registered successfully.',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          isNew: { type: 'boolean' },
        }
      }
    })
    @ApiBadRequestResponse({ description: 'Invalid registration data.' })
    @ApiInternalServerErrorResponse({ description: 'Failed to register Pokémon.' })
    @ApiBody({ type: RegisterPokemonDto })
    async registerPokemon(@Body() body: RegisterPokemonDto) {
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
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokédex updated successfully.',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          results: {
            type: 'object',
            properties: {
              inserted: {
                type: 'object',
                properties: {
                  seen: { type: 'number' },
                  caught: { type: 'number' }
                }
              },
              updated: { type: 'number' },
              total: { type: 'number' }
            }
          }
        }
      }
    })
    @ApiBadRequestResponse({ description: 'Invalid update data.' })
    @ApiInternalServerErrorResponse({ description: 'Failed to update Pokédex.' })
    @ApiBody({ type: UpdateDexDto })
    async updateDex(@Body() body: UpdateDexDto) {
        return await this.pokemonFacadeService.updateDex(body.uuid, {
            SEEN: body.SEEN,
            CAUGHT: body.CAUGHT
        });
    }

    @Get('dex/stats/:uuid')
    @ApiOperation({ summary: 'Get Pokédex statistics for user' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokédex statistics retrieved successfully.',
      type: PokedexStatistics
    })
    @ApiNotFoundResponse({ description: 'User not found.' })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Pokédex statistics.' })
    @ApiParam({ name: 'uuid', description: 'User UUID' })
    async getPokedexStats(@Param('uuid') uuid: string): Promise<PokedexStatistics> {
        return await this.pokemonFacadeService.getPokedexStatistics(uuid);
    }

    @Get('dex/detailed/:uuid')
    @ApiOperation({ summary: 'Get detailed Pokédex status for user' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Detailed Pokédex status retrieved successfully.',
      type: DetailedPokedexStatistics
    })
    @ApiNotFoundResponse({ description: 'User not found.' })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve detailed Pokédex status.' })
    @ApiParam({ name: 'uuid', description: 'User UUID' })
    async getDetailedPokedexStatus(@Param('uuid') uuid: string): Promise<DetailedPokedexStatistics> {
        return await this.pokemonFacadeService.getDetailedPokedexStatus(uuid);
    }

    @Get('dex/registries/:uuid')
    @ApiOperation({ summary: 'Get Pokédex registries for user' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokédex registries retrieved successfully.',
      type: [PokedexRegistry]
    })
    @ApiNotFoundResponse({ description: 'User not found.' })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Pokédex registries.' })
    @ApiParam({ name: 'uuid', description: 'User UUID' })
    async getPokedexRegistries(@Param('uuid') uuid: string): Promise<PokedexRegistry[]> {
        return await this.pokemonFacadeService.getPokedexRegistries(uuid);
    }

    // ==================== INTEGRATION OPERATIONS ====================

    // TODO: API FIX

    @Get('showdown/teras')
    @ApiOperation({ summary: 'Get Teras Pokémon Showdown data' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Showdown data retrieved successfully.',
      schema: {
        type: 'object',
        additionalProperties: true
      }
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Showdown data.' })
    async getTerasShowdownData() {
        return await this.pokemonFacadeService.getTerasPokemonShowdownData();
    }

    // ==================== UTILITY OPERATIONS ====================

    @Get('wordle')
    @ApiOperation({ summary: 'Get Pokémon Wordle data' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Wordle data retrieved successfully.',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            dex: { type: 'number' },
            generation: { type: 'number' },
            types: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Wordle data.' })
    async getWordleData() {
        return this.pokemonFacadeService.getWordleData();
    }

    @Get('sprites/manifest')
    @ApiOperation({ summary: 'Get sprite manifest' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Sprite manifest retrieved successfully.',
      schema: {
        type: 'object',
        additionalProperties: true
      }
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve sprite manifest.' })
    async getSpriteManifest() {
        return this.pokemonFacadeService.getSpriteManifest();
    }

    @Post('sprites/refresh')
    @ApiOperation({ summary: 'Refresh sprite manifest' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Sprite manifest refreshed successfully.',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Sprite manifest refreshed successfully' }
        }
      }
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to refresh sprite manifest.' })
    async refreshSpriteManifest() {
        await this.pokemonFacadeService.refreshSpriteManifest();
        return { message: 'Sprite manifest refreshed successfully' };
    }

    @Get('pmd/portrait/:name')
    @ApiOperation({ summary: 'Get PMD portrait by Pokémon name' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'PMD portrait retrieved successfully.',
      schema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          exists: { type: 'boolean' }
        }
      }
    })
    @ApiNotFoundResponse({ description: 'Portrait not found.' })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve PMD portrait.' })
    @ApiParam({ name: 'name', description: 'Pokémon name', example: 'Pikachu' })
    async getPmdPortrait(@Param('name') name: string) {
        return await this.pokemonFacadeService.getPmdPortrait(name);
    }

    @Get('count')
    @ApiOperation({ summary: 'Get total Pokémon count' })
    @ApiResponse({ 
      status: HttpStatus.OK, 
      description: 'Pokémon count retrieved successfully.',
      schema: {
        type: 'object',
        properties: {
          count: { type: 'number', example: 1025 }
        }
      }
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to retrieve Pokémon count.' })
    async getPokemonCount() {
        return { count: this.pokemonFacadeService.countPokemon() };
    }
}