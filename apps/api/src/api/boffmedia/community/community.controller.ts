import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import {
  ActivityItemEntity,
  SiteStatsEntity,
} from './entities/community.entity';

@ApiTags('BoffMedia | Community')
@Public()
@Controller()
export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  @Get('stats/site')
  @ApiOperation({ summary: 'Aggregate site-wide stats (public, for the landing HUD)' })
  @ApiResponse({ status: 200, type: SiteStatsEntity })
  getSiteStats() {
    return this.service.getSiteStats();
  }

  @Get('activity')
  @ApiOperation({ summary: 'Site-wide recent activity feed (public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [ActivityItemEntity] })
  getActivity(@Query('limit') limit?: number) {
    return this.service.getActivity(limit ? Number(limit) : undefined);
  }
}
