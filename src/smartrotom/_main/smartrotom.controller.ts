
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

  @Get('regions')
  @ApiOperation({ summary: 'Get regions' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Regions retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve regions.' })
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
}
