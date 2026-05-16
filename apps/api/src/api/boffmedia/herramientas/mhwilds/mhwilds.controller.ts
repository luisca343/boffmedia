import {
  Controller,
  Get,
  Param,
  Query,
  HttpStatus,
  UseInterceptors,
  Delete,
  Post,
  ValidationPipe,
  UsePipes,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { MhwildsFacadeService } from './mhwilds.facade.service';

// Import DTOs
import { GetWeaponsDto } from './dto/get-weapons.dto';
import { GetArmorDto } from './dto/get-armor.dto';
import { GetCharmsDto } from './dto/get-charms.dto';
import { GetDecorationsDto } from './dto/get-decorations.dto';
import { GetSkillsDto } from './dto/get-skills.dto';
import { GetWeaponTreeDto } from './dto/get-weapon-tree.dto';
import { GetCharmRanksDto } from './dto/get-charm-ranks.dto';
import { ClearCacheDto, WarmupCacheDto } from './dto/cache-operation.dto';
import { ValidateCacheDto } from './dto/validate-cache.dto';

// Import Entities
import { WeaponEntity } from './entities/weapon.entity';
import { ArmorEntity } from './entities/armor.entity';
import { CharmEntity, CharmRankEntity } from './entities/charm.entity';
import { DecorationEntity } from './entities/decoration.entity';
import { SkillEntity } from './entities/skill.entity';
import { CacheOperationResultEntity } from './entities/cache-info.entity';

// Import Enums
import { Locale } from './enums/locale.enum';
import { WeaponKind } from './enums/weapon-kind.enum';
import { Rarity } from './enums/rarity.enum';
import { WeaponTreeEntity } from './entities/weapon-tree.entity';

@ApiTags('BoffMedia 🛠 | MHWilds')
@Controller('tools/mhwilds')
@UseInterceptors(ResponseInterceptor)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MhwildsController {
  constructor(private readonly mhwildsFacadeService: MhwildsFacadeService) {}

  // ==================== BASIC DATA OPERATIONS ====================

  @Get('weapons')
  @ApiOperation({ summary: 'Get all weapons' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weapons retrieved successfully.',
    type: [WeaponEntity],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve weapons.',
  })
  async getWeapons(@Query() dto: GetWeaponsDto): Promise<WeaponEntity[]> {
    return await this.mhwildsFacadeService.getWeapons(
      dto.locale || Locale.SPANISH,
    );
  }

  @Get('armor')
  @ApiOperation({ summary: 'Get all armor' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Armor retrieved successfully.',
    type: [ArmorEntity],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve armor.',
  })
  async getArmor(@Query() dto: GetArmorDto): Promise<ArmorEntity[]> {
    return await this.mhwildsFacadeService.getArmor(
      dto.locale || Locale.SPANISH,
    );
  }

  @Get('charms')
  @ApiOperation({ summary: 'Get all charms' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Charms retrieved successfully.',
    type: [CharmEntity],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve charms.',
  })
  async getCharms(@Query() dto: GetCharmsDto): Promise<CharmEntity[]> {
    return await this.mhwildsFacadeService.getCharms(
      dto.locale || Locale.SPANISH,
    );
  }

  @Get('decorations')
  @ApiOperation({ summary: 'Get all decorations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Decorations retrieved successfully.',
    type: [DecorationEntity],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve decorations.',
  })
  async getDecorations(
    @Query() dto: GetDecorationsDto,
  ): Promise<DecorationEntity[]> {
    return await this.mhwildsFacadeService.getDecorations(
      dto.locale || Locale.SPANISH,
    );
  }

  @Get('skills')
  @ApiOperation({ summary: 'Get all skills' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Skills retrieved successfully.',
    type: [SkillEntity],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve skills.',
  })
  async getSkills(@Query() dto: GetSkillsDto): Promise<SkillEntity[]> {
    return await this.mhwildsFacadeService.getSkills(
      dto.locale || Locale.SPANISH,
    );
  }

  // ==================== PROCESSED DATA OPERATIONS ====================

  @Get('charms/ranks')
  @ApiOperation({ summary: 'Get all charm ranks with crafting details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Charm ranks retrieved successfully.',
    type: [CharmRankEntity],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve charm ranks.',
  })
  async getAllCharmRanks(
    @Query() dto: GetCharmRanksDto,
  ): Promise<CharmRankEntity[]> {
    return await this.mhwildsFacadeService.getAllCharmRanks(
      dto.locale || Locale.SPANISH,
    );
  }

  @Get('weapons/tree')
  @ApiOperation({ summary: 'Get weapon upgrade tree' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weapon tree created successfully.',
    type: WeaponTreeEntity,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to create weapon tree.',
  })
  async createWeaponTree(
    @Query() dto: GetWeaponTreeDto,
  ): Promise<WeaponTreeEntity> {
    return await this.mhwildsFacadeService.createWeaponTree(
      dto.locale || Locale.SPANISH,
    );
  }

  // ==================== SEARCH AND FILTER OPERATIONS ====================

  @Get('weapons/search')
  @ApiOperation({ summary: 'Search weapons by name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weapon search completed successfully.',
    type: [WeaponEntity],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Search term too short.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to search weapons.',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search term (minimum 2 characters)',
    required: true,
  })
  async searchWeaponsByName(
    @Query('q') searchTerm: string,
    @Query() dto: GetWeaponsDto,
  ): Promise<WeaponEntity[]> {
    return await this.mhwildsFacadeService.searchWeaponsByName(
      dto.locale || Locale.SPANISH,
      searchTerm,
    );
  }

  @Get('weapons/kind/:kind')
  @ApiOperation({ summary: 'Get weapons by kind/type' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weapons by kind retrieved successfully.',
    type: [WeaponEntity],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid weapon kind.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No weapons found for this kind.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve weapons by kind.',
  })
  @ApiParam({
    name: 'kind',
    description: 'Weapon kind/type',
    enum: WeaponKind,
  })
  async getWeaponsByKind(
    @Param('kind') kind: WeaponKind,
    @Query() dto: GetWeaponsDto,
  ): Promise<WeaponEntity[]> {
    return await this.mhwildsFacadeService.getWeaponsByKind(
      dto.locale || Locale.SPANISH,
      kind,
    );
  }

  @Get('armor/rarity/:rarity')
  @ApiOperation({ summary: 'Get armor by rarity' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Armor by rarity retrieved successfully.',
    type: [ArmorEntity],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid rarity value.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No armor found for this rarity.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve armor by rarity.',
  })
  @ApiParam({
    name: 'rarity',
    description: 'Armor rarity (1-10)',
    enum: Rarity,
  })
  async getArmorByRarity(
    @Param('rarity') rarity: Rarity,
    @Query() dto: GetArmorDto,
  ): Promise<ArmorEntity[]> {
    return await this.mhwildsFacadeService.getArmorByRarity(
      dto.locale || Locale.SPANISH,
      rarity,
    );
  }

  // ==================== STATISTICS OPERATIONS ====================

  @Get('statistics')
  @ApiOperation({ summary: 'Get MHWilds data statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve statistics.',
  })
  async getDataStatistics(@Query() dto: GetWeaponsDto) {
    return await this.mhwildsFacadeService.getDataStatistics(
      dto.locale || Locale.SPANISH,
    );
  }

  // ==================== CACHE MANAGEMENT OPERATIONS ====================

  @Delete('cache')
  @ApiOperation({ summary: 'Clear cache' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache cleared successfully.',
    type: CacheOperationResultEntity,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to clear cache.',
  })
  async clearCache(
    @Query() dto: ClearCacheDto,
  ): Promise<CacheOperationResultEntity> {
    return await this.mhwildsFacadeService.clearCache(
      dto.resourceType,
      dto.locale,
    );
  }

  @Get('cache/statistics')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache statistics retrieved successfully.',
    type: CacheOperationResultEntity,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve cache statistics.',
  })
  async getCacheStatistics(): Promise<CacheOperationResultEntity> {
    return await this.mhwildsFacadeService.getCacheStatistics();
  }

  @Post('cache/warmup')
  @ApiOperation({ summary: 'Warmup cache for a locale' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache warmed up successfully.',
    type: CacheOperationResultEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid locale provided.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to warmup cache.',
  })
  @ApiBody({ type: WarmupCacheDto })
  async warmupCache(
    @Body() dto: WarmupCacheDto,
  ): Promise<CacheOperationResultEntity> {
    return await this.mhwildsFacadeService.warmupCache(
      dto.locale || Locale.SPANISH,
    );
  }

  @Post('cache/validate')
  @ApiOperation({ summary: 'Validate cache for a locale' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache validated successfully.',
    type: CacheOperationResultEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid locale provided.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to validate cache.',
  })
  @ApiBody({ type: ValidateCacheDto })
  async validateCache(
    @Body() dto: ValidateCacheDto,
  ): Promise<CacheOperationResultEntity> {
    return await this.mhwildsFacadeService.validateCache(
      dto.locale || Locale.SPANISH,
    );
  }

  @Post('cache/optimize')
  @ApiOperation({ summary: 'Optimize cache storage' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache optimized successfully.',
    type: CacheOperationResultEntity,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to optimize cache.',
  })
  async optimizeCache(): Promise<CacheOperationResultEntity> {
    return await this.mhwildsFacadeService.optimizeCache();
  }

  // ==================== UTILITY OPERATIONS ====================

  @Get('locales')
  @ApiOperation({ summary: 'Get supported locales' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supported locales retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve locales.',
  })
  async getSupportedLocales() {
    const locales = await this.mhwildsFacadeService.getSupportedLocales();
    return {
      statusCode: HttpStatus.OK,
      data: {
        locales,
        total: locales.length,
      },
    };
  }

  @Get('resources')
  @ApiOperation({ summary: 'Get available resources' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available resources retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve resources.',
  })
  async getAvailableResources() {
    const resources = await this.mhwildsFacadeService.getAvailableResources();
    return {
      statusCode: HttpStatus.OK,
      data: {
        resources,
        total: resources.length,
      },
    };
  }
}
