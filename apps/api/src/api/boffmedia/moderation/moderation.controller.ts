import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { UserThrottlerGuard } from '@api/_utils/guards/user-throttler.guard';
import { ModerationService } from './moderation.service';
import { CreateContentReportDto } from './dto/moderation.dto';
import { ReportAcknowledgementEntity } from './entities/moderation.entity';

@ApiTags('BoffMedia | Moderation')
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  /**
   * The whole reporting surface: one endpoint for every kind of content.
   *
   * Rate-limited per user, not per IP — the web app proxies through one Next
   * server, so an IP limit would throttle everyone together (see
   * `UserThrottlerGuard`). Ten an hour is generous for a person and useless for
   * a brigade: the dedupe rule already makes repeat reports on ONE item free,
   * so this only bites someone reporting ten different things in an hour.
   */
  @Post('reports')
  @UseGuards(JwtAuthGuard, UserThrottlerGuard)
  @Throttle({ default: { ttl: 3_600_000, limit: 10 } })
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Report a piece of user-generated content' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Report received.',
    type: ReportAcknowledgementEntity,
  })
  async report(
    @Body() dto: CreateContentReportDto,
    @Req() req: { user: { userId: number } },
  ): Promise<ReportAcknowledgementEntity> {
    return this.moderation.report(req.user.userId, dto);
  }
}
