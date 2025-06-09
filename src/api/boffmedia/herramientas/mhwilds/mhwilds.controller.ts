import { Controller, Get, Param, Query, HttpStatus, UseInterceptors, Delete, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { MhwildsFacadeService } from './mhwilds.facade.service';

@ApiTags('boffmedia/tools/mhwilds')
@Controller('tools/mhwilds')
@UseInterceptors(ResponseInterceptor)
export class MhwildsController {
  constructor(private readonly mhwildsFacadeService: MhwildsFacadeService) {}

  // ==================== BASIC DATA OPERATIONS ====================

  @Get('weapons')
  @ApiOperation({ summary: 'Get all weapons' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Weapons retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve weapons.' })
  @ApiQuery({ name: 'locale', required: false, description: 'Language locale (e.g., en, es, ja)', example: 'es' })
  async getWeapons(@Query('locale') locale: string = 'es') {
    return await this.mhwildsFacadeService.getWeapons(locale);
  }

  @Get('armor')
  @ApiOperation({ summary: 'Get all armor' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Armor retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve armor.' })
  @ApiQuery({ name: 'locale', required: false, description: 'Language locale (e.g., en, es, ja)', example: 'es' })
  async getArmor(@Query('locale') locale: string = 'es') {
    return await this.mhwildsFacadeService.getArmor(locale);
  }

  @Get('charms')
  @ApiOperation({ summary: 'Get all charms' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Charms retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve charms.' })
  @ApiQuery({ name: 'locale', required: false, description: 'Language locale (e.g., en, es, ja)', example: 'es' })
  async getCharms(@Query('locale') locale: string = 'es') {
    return await this.mhwildsFacadeService.getCharms(locale);
  }

  @Get('decorations')
  @ApiOperation({ summary: 'Get all decorations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Decorations retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve decorations.' })
  @ApiQuery({ name: 'locale', required: false, description: 'Language locale (e.g., en, es, ja)', example: 'es' })
  async getDecorations(@Query('locale') locale: string = 'es') {
    return await this.mhwildsFacadeService.getDecorations(locale);
  }

  @Get('skills')
  @ApiOperation({ summary: 'Get all skills' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Skills retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve skills.' })
  @ApiQuery({ name: 'locale', required: false, description: 'Language locale (e.g., en, es, ja)', example: 'es' })
  async getSkills(@Query('locale') locale: string = 'es') {
    return await this.mhwildsFacadeService.getSkills(locale);
  }

  // ==================== PROCESSED DATA OPERATIONS ====================

  @Get('charms/ranks')
  @ApiOperation({ summary: 'Get all charm ranks with crafting details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Charm ranks retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve charm ranks.' })
  @ApiQuery({ name: 'locale', required: false, description: 'Language locale (e.g., en, es, ja)', example: 'es' })
  async getAllCharmRanks(@Query('locale') locale: string = 'es') {
    return await this.mhwildsFacadeService.getAllCharmRanks(locale);
  }

  @Get('weapons/tree')
  @ApiOperation({ summary: 'Get weapon upgrade tree' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Weapon tree created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create weapon tree.' })
  @ApiQuery({ name: 'locale', required: false, description: 'Language locale (e.g., en, es, ja)', example: 'es' })
  async createWeaponTree(@Query('locale') locale: string = 'es') {
    return await this.mhwildsFacadeService.createWeaponTree(locale);
  }

  // ==================== SEARCH AND FILTER OPERATIONS ====================

  @Get('weapons/search')
  @ApiOperation({ summary: 'Search weapons by name' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Weapon search completed successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Search term too short.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to search weapons.' })
  @ApiQuery({ name: 'q', description: 'Search term (minimum 2 characters)' })
  @ApiQuery({ name: 'locale', required: false, description: 'Language locale (e.g., en, es, ja)', example: 'es' })
  async searchWeaponsByName(
    @Query('q') searchTerm: string,
    @Query('locale') locale: string = 'es'
  ) {
    if (!searchTerm || searchTerm.length < 2) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Search term must be at least 2 characters'
      };
    }

    return await this.mhwildsFacadeService.searchWeaponsByName(locale, searchTerm);
  }

  @Get('weapons/kind/:kind')
  @ApiOperation({ summary: 'Get weapons by kind/type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Weapons by kind retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid weapon kind.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve weapons by kind.' })
  @ApiParam({ name: 'kind', description: 'Weapon kind/type (e.g., sword, bow, hammer)' })
  @ApiQuery({ name: 'locale', required: false, description: 'Language locale (e.g., en, es, ja)', example: 'es' })
  async getWeaponsByKind(
    @Param('kind') kind: string,
    @Query('locale') locale: string = 'es'
  ) {
    if (!kind || kind.trim().length === 0) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Weapon kind is required'
      };
    }

    return await this.mhwildsFacadeService.getWeaponsByKind(locale, kind);
  }

  @Get('armor/rarity/:rarity')
  @ApiOperation({ summary: 'Get armor by rarity' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Armor by rarity retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid rarity value.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve armor by rarity.' })
  @ApiParam({ name: 'rarity', description: 'Armor rarity (1-10)' })
  @ApiQuery({ name: 'locale', required: false, description: 'Language locale (e.g., en, es, ja)', example: 'es' })
  async getArmorByRarity(
    @Param('rarity') rarity: string,
    @Query('locale') locale: string = 'es'
  ) {
    const rarityNum = parseInt(rarity, 10);
    
    if (!Number.isInteger(rarityNum) || rarityNum < 1 || rarityNum > 10) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Rarity must be an integer between 1 and 10'
      };
    }

    return await this.mhwildsFacadeService.getArmorByRarity(locale, rarityNum);
  }

  // ==================== STATISTICS OPERATIONS ====================

  @Get('statistics')
  @ApiOperation({ summary: 'Get MHWilds data statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve statistics.' })
  @ApiQuery({ name: 'locale', required: false, description: 'Language locale (e.g., en, es, ja)', example: 'es' })
  async getDataStatistics(@Query('locale') locale: string = 'es') {
    return await this.mhwildsFacadeService.getDataStatistics(locale);
  }

  // ==================== CACHE MANAGEMENT OPERATIONS ====================

  @Delete('cache')
  @ApiOperation({ summary: 'Clear cache' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cache cleared successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to clear cache.' })
  @ApiQuery({ name: 'resourceType', required: false, description: 'Resource type to clear (optional)' })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale to clear (optional)' })
  async clearCache(
    @Query('resourceType') resourceType?: string,
    @Query('locale') locale?: string
  ) {
    return await this.mhwildsFacadeService.clearCache(resourceType, locale);
  }

  @Get('cache/statistics')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cache statistics retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve cache statistics.' })
  async getCacheStatistics() {
    return await this.mhwildsFacadeService.getCacheStatistics();
  }

  @Post('cache/warmup')
  @ApiOperation({ summary: 'Warmup cache for a locale' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cache warmed up successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to warmup cache.' })
  @ApiQuery({ name: 'locale', description: 'Locale to warmup', example: 'es' })
  async warmupCache(@Query('locale') locale: string) {
    if (!locale) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Locale is required for cache warmup'
      };
    }

    return await this.mhwildsFacadeService.warmupCache(locale);
  }

  @Post('cache/validate')
  @ApiOperation({ summary: 'Validate cache for a locale' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cache validated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to validate cache.' })
  @ApiQuery({ name: 'locale', description: 'Locale to validate', example: 'es' })
  async validateCache(@Query('locale') locale: string) {
    if (!locale) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Locale is required for cache validation'
      };
    }

    return await this.mhwildsFacadeService.validateCache(locale);
  }

  @Post('cache/optimize')
  @ApiOperation({ summary: 'Optimize cache storage' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cache optimized successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to optimize cache.' })
  async optimizeCache() {
    return await this.mhwildsFacadeService.optimizeCache();
  }

  // ==================== UTILITY OPERATIONS ====================

  @Get('locales')
  @ApiOperation({ summary: 'Get supported locales' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Supported locales retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve locales.' })
  async getSupportedLocales() {
    const locales = await this.mhwildsFacadeService.getSupportedLocales();
    return {
      statusCode: HttpStatus.OK,
      data: {
        locales,
        total: locales.length
      }
    };
  }

  @Get('resources')
  @ApiOperation({ summary: 'Get available resources' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Available resources retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve resources.' })
  async getAvailableResources() {
    const resources = await this.mhwildsFacadeService.getAvailableResources();
    return {
      statusCode: HttpStatus.OK,
      data: {
        resources,
        total: resources.length
      }
    };
  }

  @Get('cache/size/:bytes')
  @ApiOperation({ summary: 'Format cache size for display' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cache size formatted successfully.' })
  @ApiParam({ name: 'bytes', description: 'Size in bytes' })
  async formatCacheSize(@Param('bytes') bytes: string) {
    const bytesNum = parseInt(bytes, 10);
    
    if (!Number.isInteger(bytesNum) || bytesNum < 0) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Bytes must be a non-negative integer'
      };
    }

    const formattedSize = this.mhwildsFacadeService.formatCacheSize(bytesNum);
    return {
      statusCode: HttpStatus.OK,
      data: {
        bytes: bytesNum,
        formatted: formattedSize
      }
    };
  }

  @Get('cache/age/:milliseconds')
  @ApiOperation({ summary: 'Format cache age for display' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cache age formatted successfully.' })
  @ApiParam({ name: 'milliseconds', description: 'Age in milliseconds' })
  async formatCacheAge(@Param('milliseconds') milliseconds: string) {
    const millisecondsNum = parseInt(milliseconds, 10);
    
    if (!Number.isInteger(millisecondsNum) || millisecondsNum < 0) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Milliseconds must be a non-negative integer'
      };
    }

    const formattedAge = this.mhwildsFacadeService.formatCacheAge(millisecondsNum);
    return {
      statusCode: HttpStatus.OK,
      data: {
        milliseconds: millisecondsNum,
        formatted: formattedAge
      }
    };
  }
}