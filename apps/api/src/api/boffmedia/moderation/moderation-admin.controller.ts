import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { FullSessionGuard } from '@api/_utils/guards/full-session.guard';
import { STEP_UP_HEADER, StepUpGuard } from '@api/_utils/guards/step-up.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { ModerationService } from './moderation.service';
import {
  CreateSanctionDto,
  ModerationDecisionDto,
  ModerationQueueQueryDto,
} from './dto/moderation.dto';
import {
  ModerationItemDetailEntity,
  ModerationQueuePageEntity,
} from './entities/moderation.entity';

/**
 * The report queue.
 *
 * `BOFF_ADMIN` like every other admin section — this is deliberately NOT the
 * place to invent a moderator sub-role. The single-role problem is a known,
 * separate decision (audit finding W8); splitting it here would leave the repo
 * with one section authorised differently from the other eleven, which is worse
 * than the problem it solves.
 */
@ApiTags('BoffMedia | Moderation Admin')
@Controller('moderation/admin')
@UseGuards(JwtAuthGuard, FullSessionGuard, RolesGuard)
@Roles(USER_ROLES.BOFF_ADMIN)
@ApiBearerAuth('JWT')
export class ModerationAdminController {
  constructor(private readonly moderation: ModerationService) {}

  @Get('reports')
  @ApiOperation({
    summary: 'The report queue, one row per reported item',
  })
  @ApiResponse({ status: HttpStatus.OK, type: ModerationQueuePageEntity })
  async queue(
    @Query() query: ModerationQueueQueryDto,
  ): Promise<ModerationQueuePageEntity> {
    return this.moderation.queue(query);
  }

  @Get('reports/:contentType/:contentId')
  @ApiOperation({
    summary: 'One reported item: every report on it, plus the author’s record',
  })
  @ApiParam({ name: 'contentType', example: 'forum_post' })
  @ApiParam({ name: 'contentId', example: '412' })
  @ApiResponse({ status: HttpStatus.OK, type: ModerationItemDetailEntity })
  async detail(
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
  ): Promise<ModerationItemDetailEntity> {
    return this.moderation.detail(contentType, contentId);
  }

  // Dismiss / hide / unhide carry no step-up. They change one item, they are
  // undone by one click, and demanding a TOTP code per decision is how a queue
  // stops being worked at all. See the sanction endpoint for the line.
  @Post('reports/:contentType/:contentId/dismiss')
  @ApiOperation({ summary: 'Close the reports and leave the content up' })
  @ApiResponse({ status: HttpStatus.CREATED })
  async dismiss(
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
    @Body() dto: ModerationDecisionDto,
    @Req() req: { user: { userId: number } },
  ): Promise<{ success: true }> {
    return this.moderation.dismiss(
      contentType,
      contentId,
      dto.reason,
      req.user.userId,
    );
  }

  @Post('reports/:contentType/:contentId/hide')
  @ApiOperation({ summary: 'Take the content out of view (reversible)' })
  @ApiResponse({ status: HttpStatus.CREATED })
  async hide(
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
    @Body() dto: ModerationDecisionDto,
    @Req() req: { user: { userId: number } },
  ): Promise<{ success: true }> {
    return this.moderation.hide(
      contentType,
      contentId,
      dto.reason,
      req.user.userId,
    );
  }

  @Post('reports/:contentType/:contentId/unhide')
  @ApiOperation({ summary: 'Put previously hidden content back' })
  @ApiResponse({ status: HttpStatus.CREATED })
  async unhide(
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
    @Body() dto: ModerationDecisionDto,
    @Req() req: { user: { userId: number } },
  ): Promise<{ success: true }> {
    return this.moderation.unhide(
      contentType,
      contentId,
      dto.reason,
      req.user.userId,
    );
  }

  /**
   * The one moderation action behind a step-up.
   *
   * The existing step-up sites are chosen by "changes what runs on someone
   * else's machine". A content ban is the moderation equivalent: it stops a
   * person participating from the moment it lands, it is felt before anyone
   * notices the admin session was borrowed, and it is the single action an
   * attacker with a stolen console tab would actually want. Hiding a post is
   * not — it costs one click to undo and hurts nobody's account.
   */
  @Post('sanctions')
  @UseGuards(StepUpGuard)
  @ApiHeader({
    name: STEP_UP_HEADER,
    description: 'Fresh two-factor confirmation token',
    required: true,
  })
  @ApiOperation({ summary: 'Warn or content-ban the author of reported content' })
  @ApiResponse({ status: HttpStatus.CREATED })
  async sanction(
    @Body() dto: CreateSanctionDto,
    @Req() req: { user: { userId: number } },
  ): Promise<{ success: true; sanctionId: number }> {
    return this.moderation.sanction(dto, req.user.userId);
  }
}
