import { Body, Controller, Get, Post, Query, HttpStatus, Param, HttpException, UseInterceptors, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { MisionesFacadeService } from './misiones.facade.service';
import { NPCUpdateRequest } from './services/npc.service';
import { ImageUploadRequest } from './services/image.service';

@ApiTags('SmartRotom | Misiones')
@Controller('smartrotom/misiones')
@UseInterceptors(ResponseInterceptor)
export class MisionesController {
  constructor(
    private readonly misionesFacadeService: MisionesFacadeService,
  ) {}

  // ==================== QUEST ENDPOINTS ====================

  @Get()
  @ApiOperation({ summary: 'Get all quests' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quests retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve quests.' })
  @ApiQuery({ name: 'force', description: 'Force refresh cache (1 = force, 0 = use cache)', required: false })
  async getAllQuests(@Query('force') force?: string) {
    const forceRefresh = force ? parseInt(force, 10) : 0;
    return await this.misionesFacadeService.getAllQuests(forceRefresh);
  }

  @Post()
  @ApiOperation({ summary: 'Get quests for specific user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User quests retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid user UUID.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve user quests.' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        uuid: { type: 'string', description: 'User UUID' }
      } 
    } 
  })
  async getQuestsForUser(@Body() body: { uuid: string }) {
    if (!body.uuid) {
      throw new HttpException('UUID is required', HttpStatus.BAD_REQUEST);
    }
    return await this.misionesFacadeService.getQuestsForUser(body.uuid);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Force refresh quest cache' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cache refreshed successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to refresh cache.' })
  async refreshCache() {
    return await this.misionesFacadeService.refreshQuestCache();
  }

  @Get('cache/status')
  @ApiOperation({ summary: 'Get quest cache status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cache status retrieved successfully.' })
  async getCacheStatus() {
    return await this.misionesFacadeService.getQuestCacheStatus();
  }

  // ==================== NPC ENDPOINTS ====================

  @Post('npcs')
  @ApiOperation({ summary: 'Update NPCs data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'NPCs updated successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid NPC data.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update NPCs.' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        npcs: { 
          type: 'array',
          description: 'Array of NPC objects',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              text: { type: 'string' },
              questId: { type: 'number' }
            }
          }
        }
      } 
    } 
  })
  async updateNPCs(@Body() body: NPCUpdateRequest) {
    return await this.misionesFacadeService.updateNPCs(body);
  }

  @Get('npcs')
  @ApiOperation({ summary: 'Get all NPCs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'NPCs retrieved successfully.' })
  async getAllNPCs() {
    return await this.misionesFacadeService.getAllNPCs();
  }

  @Get('npcs/:id')
  @ApiOperation({ summary: 'Get NPC by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'NPC retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'NPC not found.' })
  @ApiParam({ name: 'id', description: 'NPC ID' })
  async getNPCById(@Param('id') id: string) {
    const npcId = parseInt(id, 10);
    if (isNaN(npcId)) {
      throw new HttpException('Invalid NPC ID', HttpStatus.BAD_REQUEST);
    }

    const npc = await this.misionesFacadeService.getNPCById(npcId);
    if (!npc) {
      throw new HttpException('NPC not found', HttpStatus.NOT_FOUND);
    }
    
    return npc;
  }

  @Get('npcs/quest/:questId')
  @ApiOperation({ summary: 'Get NPCs by quest ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quest NPCs retrieved successfully.' })
  @ApiParam({ name: 'questId', description: 'Quest ID' })
  async getNPCsByQuestId(@Param('questId') questId: string) {
    const id = parseInt(questId, 10);
    if (isNaN(id)) {
      throw new HttpException('Invalid Quest ID', HttpStatus.BAD_REQUEST);
    }

    return await this.misionesFacadeService.getNPCsByQuestId(id);
  }

  // ==================== IMAGE ENDPOINTS ====================

  @Post('img/customNPC')
  @ApiOperation({ summary: 'Upload custom NPC image' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image uploaded successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid image data.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to upload image.' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        npcName: { type: 'string', description: 'NPC name' },
        image: { type: 'string', description: 'Base64 encoded PNG image' }
      } 
    } 
  })
  async uploadCustomNPCImage(@Body() body: ImageUploadRequest) {
    const result = await this.misionesFacadeService.uploadCustomNPCImage(body);
    
    if (result.status === 'ERROR') {
      throw new HttpException(result.error || 'Upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    return result;
  }

  @Get('img/customNPC/render/:npcName')
  @ApiOperation({ summary: 'Check if custom NPC render exists' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Render status retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Render image not found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid NPC name.' })
  @ApiParam({ name: 'npcName', description: 'NPC name' })
  async checkCustomNPCRender(@Param('npcName') npcName: string) {
    if (!await this.misionesFacadeService.validateNPCName(npcName)) {
      throw new HttpException('Invalid NPC name', HttpStatus.BAD_REQUEST);
    }

    const result = await this.misionesFacadeService.checkCustomNPCRenderExists(npcName);
    
    if (!result.exists) {
      throw new HttpException('Render image not found', HttpStatus.NOT_FOUND);
    }
    
    return { status: 'OK', exists: true };
  }

  @Get('img/customNPC/:npcName')
  @ApiOperation({ summary: 'Check if custom NPC image exists' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image status retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Image not found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid NPC name.' })
  @ApiParam({ name: 'npcName', description: 'NPC name' })
  async checkCustomNPCImage(@Param('npcName') npcName: string) {
    if (!await this.misionesFacadeService.validateNPCName(npcName)) {
      throw new HttpException('Invalid NPC name', HttpStatus.BAD_REQUEST);
    }

    const result = await this.misionesFacadeService.checkCustomNPCImageExists(npcName);
    
    if (!result.exists) {
      throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
    }
    
    return { status: 'OK', exists: true };
  }

  @Delete('img/customNPC/:npcName')
  @ApiOperation({ summary: 'Delete custom NPC images' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Images deleted successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid NPC name.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to delete images.' })
  @ApiParam({ name: 'npcName', description: 'NPC name' })
  async deleteCustomNPCImage(@Param('npcName') npcName: string) {
    if (!await this.misionesFacadeService.validateNPCName(npcName)) {
      throw new HttpException('Invalid NPC name', HttpStatus.BAD_REQUEST);
    }

    const result = await this.misionesFacadeService.deleteCustomNPCImage(npcName);
    
    if (!result.success) {
      throw new HttpException(result.error || 'Delete failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    return { status: 'OK', deleted: true };
  }

  // ==================== VALIDATION ENDPOINTS ====================

  @Get('validate/user/:uuid')
  @ApiOperation({ summary: 'Validate if user exists in quest system' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User validation result.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async validateUser(@Param('uuid') uuid: string) {
    return { 
      exists: await this.misionesFacadeService.validateUserExists(uuid) 
    };
  }

  @Get('validate/npc/:npcName')
  @ApiOperation({ summary: 'Validate NPC name format' })
  @ApiResponse({ status: HttpStatus.OK, description: 'NPC name validation result.' })
  @ApiParam({ name: 'npcName', description: 'NPC name to validate' })
  async validateNPCName(@Param('npcName') npcName: string) {
    return { 
      valid: await this.misionesFacadeService.validateNPCName(npcName) 
    };
  }

  // ==================== HEALTH CHECK ENDPOINT ====================

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Health status retrieved successfully.' })
  async getHealth() {
    return await this.misionesFacadeService.getSystemHealth();
  }
}