import { Body, Controller, Get, Post, Query, HttpStatus, Logger } from '@nestjs/common';
import { MisionesService } from './misiones.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';

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
}