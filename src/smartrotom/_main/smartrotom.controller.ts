
import axios from 'axios';
import { NpcImageDto } from '../_dto/npc-image-dto';
import { SmartrotomService } from './smartrotom.service';
import { UuidDto } from '../_dto/smartrotom-request-dto';
import { ResponseService } from '@/response/response.service';
import { BattleAchievementDto } from '../_dto/battle-achievement-dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post, HttpException, HttpStatus, Logger } from '@nestjs/common';

@ApiTags('smartrotom')
@Controller('smartrotom')
export class SmartrotomController {
  private readonly logger = new Logger(SmartrotomController.name);

  constructor(
    private smartrotomService: SmartrotomService,
    private readonly responseService: ResponseService,
  ) {}

  @Get('performance')
  @ApiOperation({ summary: 'Get performance' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Performance retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve performance.' })
  async getPerformance() {
    const performance = await this.smartrotomService.getPerformance();
    return {
      data: performance,
      statusCode: 200,
      message: 'Performance retrieved successfully',
    }
  }
}
