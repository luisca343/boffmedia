import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SmartrotomService } from './smartrotom.service';
import fs from 'fs';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';
import { SmartrotomRequestDto, UuidDto } from '../_dto/smartrotom-request-dto';
import { BattleAchievementDto } from '../_dto/battle-achievement-dto';
import { NpcImageDto } from '../_dto/npc-image-dto';
import axios from 'axios';

@ApiTags('smartrotom')
@Controller('smartrotom')
export class SmartrotomController {
  private readonly logger = new Logger(SmartrotomController.name);

  constructor(
    private smartrotomService: SmartrotomService,
    private readonly responseService: ResponseService,
  ) {}

  @Post('battle-achievements')
  @ApiOperation({ summary: 'Get battle achievements for a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Battle achievements retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve battle achievements.',
  })
  @ApiBody({ type: UuidDto })
  async getAchievements(@Body() { uuid }: { uuid: string }) {
    const action = 'get battle achievements';
    try {
      this.responseService.logRequest(action, { uuid });
      const achievements = await this.smartrotomService.getAchievements(uuid);
      this.responseService.logSuccess(action, achievements);
      return this.responseService.createSuccessResponse(
        'Battle achievements retrieved successfully',
        achievements,
      );
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Get('battle-achievement/:uuid/:achievementId')
  @ApiOperation({ summary: 'Get a specific achievement for a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Battle chievement retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve battle achievement.',
  })
  async getAchievementForPlayer(
    @Param('uuid') uuid: string,
    @Param('achievementId') achievementId: string,
  ) {
    const action = 'get achievement for player';
    try {
      this.responseService.logRequest(action, { uuid, achievementId });
      const achievement = await this.smartrotomService.getAchievementForPlayer(
        uuid,
        achievementId,
      );
      this.responseService.logSuccess(action, achievement);
      return this.responseService.createSuccessResponse(
        'Achievement retrieved successfully',
        achievement,
      );
    } catch (error) {
      this.responseService.handleError(action, error, { uuid, achievementId });
    }
  }

  @Post('img/customNPC')
  @ApiOperation({ summary: 'Upload a custom NPC image' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image uploaded successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to upload image.',
  })
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Render image retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Render image not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve render image.',
  })
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Image not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve image.',
  })
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

  @Post('stats')
  @ApiOperation({ summary: 'Get stats for a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stats retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve stats.',
  })
  async getStats(@Body() { uuid }: UuidDto) {
    const action = 'get stats';
    try {
      this.responseService.logRequest(action, { uuid });
      const stats = await this.smartrotomService.getStats(uuid);
      this.responseService.logSuccess(action, stats);
      return this.responseService.createSuccessResponse(
        'Stats retrieved successfully',
        stats,
      );
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Post('team')
  @ApiOperation({ summary: 'Get team for a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve team.',
  })
  async getTeam(@Body() { uuid }: UuidDto) {
    const action = 'get team';
    try {
      this.responseService.logRequest(action, { uuid });
      const team = await this.smartrotomService.getTeam(uuid);
      this.responseService.logSuccess(action, team);
      return this.responseService.createSuccessResponse(
        'Team retrieved successfully',
        team,
      );
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Get('regions')
  @ApiOperation({ summary: 'Get regions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Regions retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve regions.',
  })
  async getRegions() {
    const regions = await axios.get(`${process.env.WINGULL_API}/regions`);

    const townColors = {
      ARRECIFE_WINGULL: { fill: 0x5500bfff, border: 0x00bfff },
      PUERTO_WINGULL: { fill: 0x550077be, border: 0x0077be },
      PUEBLO_TULIPAN: { fill: 0x5532cd32, border: 0x32cd32 },
      PUEBLO_SHIROI: { fill: 0x55ffffff, border: 0xffffff },
      PUEBLO_TAKAI: { fill: 0x55e0ffff, border: 0xe0ffff },
      PUEBLO_HAGANE: { fill: 0x55808080, border: 0x808080 },
      PUEBLO_DENTO: { fill: 0x556a5acd, border: 0x6a5acd },
      PUEBLO_IWA: { fill: 0x55a9a9a9, border: 0xa9a9a9 },
      PUEBLO_TSUCHI: { fill: 0x55d2691e, border: 0xd2691e },
      PUEBLO_OASIS: { fill: 0x55f4a460, border: 0xf4a460 },
      PUEBLO_SENSHI: { fill: 0x55b22222, border: 0xb22222 },
      PUEBLO_KINOKO: { fill: 0x55ff69b4, border: 0xff69b4 },
      PUEBLO_SAKURA: { fill: 0xffffb7c5, border: 0xffb7c5 },
      PUEBLO_DOKU: { fill: 0x55800080, border: 0x800080 },
      PUEBLO_GAKU: { fill: 0x55f4a460, border: 0xf4a460 },
      PUEBLO_LAVANDA: { fill: 0x55483d8b, border: 0x483d8b },
      PUEBLO_DENKI: { fill: 0x55ffff00, border: 0xffff00 },
      PUEBLO_MIZU: { fill: 0x554169e1, border: 0x4169e1 },
      PUEBLO_OLIVO: { fill: 0x55556b2f, border: 0x556b2f },
      NARUKAMI: { fill: 0x55ffd700, border: 0xffd700 },
      AKINA: { fill: 0x55ff4500, border: 0xff4500 },
      FUKITSU: { fill: 0x55000000, border: 0x000000 },
      GANSOLIA: { fill: 0x55deb887, border: 0xdeb887 },
    };

    const regionsWithColors = regions.data.map((region: any) => {
      const color = townColors[region.name.toUpperCase()];
      if (color) {
        region.fillColor = color.fill & 0xffffffff;
        region.strokeColor = color.border & 0xffffffff;
      }
      return region;
    });

    return regionsWithColors;
  }

  /**
   * Battle Section
   *
   * The following endpoints are related to the battle section of SmartRotom.
   **/

  @Post('battle')
  @ApiOperation({
    summary: 'Saves a Battle, and registers its achievement if any',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Battle saved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to save battle.',
  })
  @ApiBody({ type: BattleAchievementDto })
  async addBattleAchievement(@Body() battleAchievement: BattleAchievementDto) {
    const action = 'add battle achievement';
    try {
      this.responseService.logRequest(action, battleAchievement);
      const result =
        await this.smartrotomService.addBattleAchievement(battleAchievement);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse(
        'Battle saved successfully',
        result,
      );
    } catch (error) {
      this.responseService.handleError(action, error, battleAchievement);
    }
  }

  @Get('repeticiones/:uuid')
  @ApiOperation({ summary: 'Get repetitions for a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Repetitions retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve repetitions.',
  })
  async getRepeticiones(@Param('uuid') uuid: string) {
    const action = 'get repetitions';
    try {
      this.responseService.logRequest(action, { uuid });
      const repetitions = await this.smartrotomService.getRepeticiones(uuid);
      this.responseService.logSuccess(action, repetitions);
      return this.responseService.createSuccessResponse(
        'Repetitions retrieved successfully',
        repetitions,
      );
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Get('battleconfig/:npcConfigName')
  @ApiOperation({ summary: 'Get battle configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Battle configuration retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve battle configuration.',
  })
  async getBattleConfig(@Param('npcConfigName') npcConfigName: string) {
    const action = 'get battle configuration';
    try {
      this.responseService.logRequest(action, { npcConfigName });
      const config =
        await this.smartrotomService.getBattleConfig(npcConfigName);
      this.responseService.logSuccess(action, config);
      return this.responseService.createSuccessResponse(
        'Battle configuration retrieved successfully',
        config,
      );
    } catch (error) {
      this.responseService.handleError(action, error, { npcConfigName });
    }
  }
}
