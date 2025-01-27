import fs from 'fs';
import { Body, Controller, Get, Post, Query, HttpStatus, Logger, Param, HttpException } from '@nestjs/common';
import { MisionesService } from './misiones.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';
import { NpcImageDto } from '../_dto/npc-image-dto';

@ApiTags('smartrotom/misiones')
@Controller('/smartrotom/misiones')
export class MisionesController {
  private readonly logger = new Logger(MisionesController.name);

  constructor(
    private readonly misionesService: MisionesService,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all quests' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quests retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve quests.' })
  async getAllQuests(@Query('force') force: number) {
    const action = 'get all quests';
    try {
      this.responseService.logRequest(action, { force });
      const quests = await this.misionesService.getAllQuests(force);
      this.responseService.logSuccess(action, quests);
      return this.responseService.createSuccessResponse('Quests retrieved successfully', quests);
    } catch (error) {
      this.responseService.handleError(action, error, { force });
    }
  }

  @Post()
  @ApiOperation({ summary: 'Get quests for user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quests for user retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve quests for user.' })
  async getQuestsForUser(@Body() body: { uuid: string }) {
    const action = 'get quests for user';
    try {
      this.responseService.logRequest(action, body);
      const quests = await this.misionesService.getQuestsForUser(body.uuid);
      this.responseService.logSuccess(action, quests);
      return this.responseService.createSuccessResponse('Quests for user retrieved successfully', quests);
    } catch (error) {
      this.responseService.handleError(action, error, body);
    }
  }

  @Post('npcs')
  @ApiOperation({ summary: 'Update NPCs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'NPCs updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update NPCs.' })
  async updateNPCs(@Body() body: { npcs: any }) {
    const action = 'update NPCs';
    try {
      this.responseService.logRequest(action, body);
      const result = await this.misionesService.updateNPCs(body.npcs);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('NPCs updated successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, body);
    }
  }

  @Post('img/customNPC')
  @ApiOperation({ summary: 'Upload a custom NPC image' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image uploaded successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to upload image.' })
  async img(@Body() { npcName, image }: NpcImageDto) {
    const action = 'upload custom NPC image';
    try {
      this.responseService.logRequest(action, { npcName });
      fs.writeFileSync(
        `./public/smartrotom/img/customNPC/renders/${npcName}.png`,
        image.replace(/^data:image\/png;base64,/, ''),
        'base64',
      );
      this.responseService.logSuccess(action, { status: 'OK' });
      return this.responseService.createSuccessResponse(
        'Image uploaded successfully',
        { status: 'OK' },
      );
    } catch (error) {
      this.responseService.handleError(action, error, { npcName });
    }
  }

  @Get('img/customNPC/render/:npcName')
  @ApiOperation({ summary: 'Get a custom NPC render image' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Render image retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Render image not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve render image.' })
  async getImg(@Param('npcName') npcName: string) {
    const action = 'get custom NPC render image';
    try {
      this.responseService.logRequest(action, { npcName });
      const exists = fs.existsSync(
        `./public/smartrotom/img/customNPC/renders/${npcName}.png`,
      );
      if (!exists) {
        throw new HttpException('Render image not found', HttpStatus.NOT_FOUND);
      }
      this.responseService.logSuccess(action, { status: 'OK' });
      return this.responseService.createSuccessResponse(
        'Render image retrieved successfully',
        { status: 'OK' },
      );
    } catch (error) {
      this.responseService.handleError(action, error, { npcName });
    }
  }

  @Get('img/customNPC/:npcName')
  @ApiOperation({ summary: 'Get a custom NPC image' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Image not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve image.' })
  async get(@Param('npcName') npcName: string) {
    const action = 'get custom NPC image';
    try {
      this.responseService.logRequest(action, { npcName });
      const exists = fs.existsSync(
        `./public/smartrotom/img/customNPC/${npcName}.png`,
      );
      if (!exists) {
        throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
      }
      this.responseService.logSuccess(action, { status: 'OK' });
      return this.responseService.createSuccessResponse(
        'Image retrieved successfully',
        { status: 'OK' },
      );
    } catch (error) {
      this.responseService.handleError(action, error, { npcName });
    }
  }

}