import fs from 'fs';
import { Body, Controller, Get, Post, Query, HttpStatus, Param, HttpException, UseInterceptors } from '@nestjs/common';
import { MisionesService } from './misiones.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NpcImageDto } from '../_dto/npc-image-dto';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';

@ApiTags('smartrotom/misiones')
@Controller('/smartrotom/misiones')
@UseInterceptors(ResponseInterceptor)
export class MisionesController {
  constructor(
    private readonly misionesService: MisionesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all quests' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quests retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve quests.' })
  async getAllQuests(@Query('force') force: number) {
    return await this.misionesService.getAllQuests(force);
  }

  @Post()
  @ApiOperation({ summary: 'Get quests for user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quests for user retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve quests for user.' })
  async getQuestsForUser(@Body() body: { uuid: string }) {
    return await this.misionesService.getQuestsForUser(body.uuid);
  }

  @Post('npcs')
  @ApiOperation({ summary: 'Update NPCs' })
  @ApiResponse({ status: HttpStatus.OK, description: 'NPCs updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update NPCs.' })
  async updateNPCs(@Body() body: { npcs: any }) {
    return await this.misionesService.updateNPCs(body.npcs);
  }

  @Post('img/customNPC')
  @ApiOperation({ summary: 'Upload a custom NPC image' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image uploaded successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to upload image.' })
  async img(@Body() { npcName, image }: NpcImageDto) {
    fs.writeFileSync(
      `./public/smartrotom/img/customNPC/renders/${npcName}.png`,
      image.replace(/^data:image\/png;base64,/, ''),
      'base64',
    );
    return { status: 'OK' };
  }

  @Get('img/customNPC/render/:npcName')
  @ApiOperation({ summary: 'Get a custom NPC render image' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Render image retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Render image not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve render image.' })
  async getImg(@Param('npcName') npcName: string) {
    const exists = fs.existsSync(
      `./public/smartrotom/img/customNPC/renders/${npcName}.png`,
    );
    if (!exists) {
      throw new HttpException('Render image not found', HttpStatus.NOT_FOUND);
    }
    return { status: 'OK' };
  }

  @Get('img/customNPC/:npcName')
  @ApiOperation({ summary: 'Get a custom NPC image' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Image not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve image.' })
  async get(@Param('npcName') npcName: string) {
    const exists = fs.existsSync(
      `./public/smartrotom/img/customNPC/${npcName}.png`,
    );
    if (!exists) {
      throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
    }
    return { status: 'OK' };
  }
}