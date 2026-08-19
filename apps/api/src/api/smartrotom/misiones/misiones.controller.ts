import { Roles } from '@api/_utils/decorators/roles.decorator';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  UseGuards,
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
} from '@nestjs/swagger';
import { MisionesFacadeService } from './misiones.facade.service';

// Import DTOs
import { GetQuestsDto } from './dto/get-quests.dto';
import { GetUserQuestsDto } from './dto/get-user-quests.dto';
import { UpdateNPCsDto } from './dto/update-npcs.dto';
import { UploadNpcImageDto } from './dto/upload-image.dto';

// Import Response Entities
import { QuestSystemData } from './entities/quest-system-data.entity';
import { UserQuestData } from './entities/user-quest-data.entity';
import { NPCUpdateResponse } from './entities/npc-update-response.entity';
import {
  ImageUploadResponse,
  ImageExistsResponse,
} from './entities/image-response.entity';
import {
  CacheRefreshResponse,
  CacheStatusResponse,
} from './entities/cache-response.entity';
import { SystemHealthResponse } from './entities/system-health-response.entity';
import { NPC } from './entities/npc.entity';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { Public } from '@api/_utils/decorators/public.decorator';

@ApiTags('SmartRotom | Misiones')
// Mission and NPC reads are public (the missions page needs no account); authoring, cache control and image upload are admin-only and used to be public.
@Public()
@Controller('smartrotom/misiones')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MisionesController {
  constructor(private readonly misionesFacadeService: MisionesFacadeService) {}

  // ==================== QUEST ENDPOINTS ====================

  @Get()
  @ApiOperation({ summary: 'Get all quests from the system' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quests retrieved successfully.',
    type: QuestSystemData,
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve quests.' })
  @ApiQuery({
    name: 'force',
    description: 'Force refresh cache (1 = force, 0 = use cache)',
    required: false,
    type: Number,
    enum: [0, 1],
  })
  async getAllQuests(@Query() query: GetQuestsDto) {
    return await this.misionesFacadeService.getAllQuests(query.force);
  }

  @Post('user')
  @ApiOperation({ summary: 'Get quests for specific user with progress' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User quests retrieved successfully.',
    type: UserQuestData,
  })
  @ApiBadRequestResponse({ description: 'Invalid user UUID.' })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve user quests.',
  })
  @ApiBody({ type: GetUserQuestsDto })
  async getQuestsForUser(@Body() getUserQuestsDto: GetUserQuestsDto) {
    return await this.misionesFacadeService.getQuestsForUser(
      getUserQuestsDto.uuid,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN)
  @Post('cache/refresh')
  @ApiOperation({ summary: 'Force refresh quest cache from external API' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache refreshed successfully.',
    type: CacheRefreshResponse,
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to refresh cache.' })
  async refreshCache() {
    return await this.misionesFacadeService.refreshQuestCache();
  }

  @Get('cache/status')
  @ApiOperation({ summary: 'Get quest cache status and health' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache status retrieved successfully.',
    type: CacheStatusResponse,
  })
  async getCacheStatus() {
    return await this.misionesFacadeService.getCacheStatus();
  }

  // ==================== NPC ENDPOINTS ====================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN)
  @Post('npcs')
  @ApiOperation({ summary: 'Update NPCs data in the system' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'NPCs updated successfully.',
    type: NPCUpdateResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid NPC data.' })
  @ApiInternalServerErrorResponse({ description: 'Failed to update NPCs.' })
  @ApiBody({ type: UpdateNPCsDto })
  async updateNPCs(@Body() updateNPCsDto: UpdateNPCsDto) {
    return await this.misionesFacadeService.updateNPCs(updateNPCsDto);
  }

  @Get('npcs')
  @ApiOperation({ summary: 'Get all NPCs from the system' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'NPCs retrieved successfully.',
    type: [NPC],
  })
  async getAllNPCs() {
    return await this.misionesFacadeService.getAllNPCs();
  }

  @Get('npcs/:id')
  @ApiOperation({ summary: 'Get specific NPC by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'NPC retrieved successfully.',
    type: NPC,
  })
  @ApiNotFoundResponse({ description: 'NPC not found.' })
  @ApiBadRequestResponse({ description: 'Invalid NPC ID.' })
  @ApiParam({ name: 'id', description: 'NPC ID', type: Number })
  async getNPCById(@Param('id') id: string) {
    const npcId = parseInt(id, 10);
    const npc = await this.misionesFacadeService.getNPCById(npcId);

    if (!npc) {
      throw new Error('NPC not found');
    }

    return npc;
  }

  @Get('npcs/quest/:questId')
  @ApiOperation({ summary: 'Get all NPCs associated with a quest' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quest NPCs retrieved successfully.',
    type: [NPC],
  })
  @ApiBadRequestResponse({ description: 'Invalid Quest ID.' })
  @ApiParam({ name: 'questId', description: 'Quest ID', type: Number })
  async getNPCsByQuestId(@Param('questId') questId: string) {
    const id = parseInt(questId, 10);
    return await this.misionesFacadeService.getNPCsByQuestId(id);
  }

  // ==================== IMAGE ENDPOINTS ====================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN)
  @Post('images/upload')
  @ApiOperation({ summary: 'Upload custom NPC image' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image uploaded successfully.',
    type: ImageUploadResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid image data or format.' })
  @ApiInternalServerErrorResponse({ description: 'Failed to upload image.' })
  @ApiBody({ type: UploadNpcImageDto })
  async uploadCustomNPCImage(@Body() uploadImageDto: UploadNpcImageDto) {
    return await this.misionesFacadeService.uploadNPCImage(uploadImageDto);
  }

  @Get('images/render/:npcName')
  @ApiOperation({ summary: 'Check if custom NPC render exists' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Render status retrieved successfully.',
    type: ImageExistsResponse,
  })
  @ApiNotFoundResponse({ description: 'Render image not found.' })
  @ApiBadRequestResponse({ description: 'Invalid NPC name.' })
  @ApiParam({ name: 'npcName', description: 'NPC name' })
  async checkCustomNPCRender(@Param('npcName') npcName: string) {
    return await this.misionesFacadeService.checkNPCRenderExists(npcName);
  }

  @Get('images/:npcName')
  @ApiOperation({ summary: 'Check if custom NPC image exists' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image status retrieved successfully.',
    type: ImageExistsResponse,
  })
  @ApiNotFoundResponse({ description: 'Image not found.' })
  @ApiBadRequestResponse({ description: 'Invalid NPC name.' })
  @ApiParam({ name: 'npcName', description: 'NPC name' })
  async checkCustomNPCImage(@Param('npcName') npcName: string) {
    return await this.misionesFacadeService.checkNPCImageExists(npcName);
  }

  // ==================== VALIDATION ENDPOINTS ====================

  @Get('validate/user/:uuid')
  @ApiOperation({ summary: 'Validate if user exists in quest system' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User validation result.',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean', example: true },
      },
    },
  })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async validateUser(@Param('uuid') uuid: string) {
    const exists = await this.misionesFacadeService.validateUserExists(uuid);
    return { exists };
  }

  // ==================== HEALTH CHECK ENDPOINT ====================

  @Get('health')
  @ApiOperation({ summary: 'Get comprehensive system health status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health status retrieved successfully.',
    type: SystemHealthResponse,
  })
  async getHealth() {
    return await this.misionesFacadeService.getSystemHealth();
  }
}
