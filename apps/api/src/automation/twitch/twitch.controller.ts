import { Roles } from '@api/_utils/decorators/roles.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TwitchMonitorService } from './services/twitch-monitor.service';
import { TwitchApiService } from './services/twitch-api.service';
import { NotificationService } from './services/notification.service';
import { NotificationTargetDto } from './dto/notification-target.dto';
import { Logger } from 'nestjs-pino';
import { SkipEnvelope } from '@/common/decorators/skip-envelope.decorator';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { Public } from '@api/_utils/decorators/public.decorator';

@ApiTags('Automation - Twitch')
// Stream status is public; changing what is monitored or where notifications land is not.
@Public()
@Controller('automation/twitch')
@SkipEnvelope()
export class TwitchController {
  constructor(
    private readonly logger: Logger,

    private readonly twitchMonitorService: TwitchMonitorService,
    private readonly twitchApiService: TwitchApiService,
    private readonly notificationService: NotificationService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get monitoring status' })
  @ApiResponse({ status: 200, description: 'Current monitoring status' })
  getMonitoringStatus() {
    return {
      status: 'active',
      monitoring: this.twitchMonitorService.getMonitoringStatus(),
      targets: this.notificationService.getTargets().map((target) => ({
        type: target.type,
        configured: true,
      })),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @Post('check-now')
  @ApiOperation({ summary: 'Trigger immediate stream check' })
  @ApiResponse({ status: 200, description: 'Manual check completed' })
  async checkStreamsNow() {
    const result = await this.twitchMonitorService.checkStreamsNow();
    return {
      message: 'Manual stream check completed',
      ...result,
    };
  }

  @Get('streams/user/:username')
  @ApiOperation({ summary: 'Get stream by username' })
  @ApiResponse({ status: 200, description: 'Stream information for the user' })
  async getStreamByUsername(@Param('username') username: string) {
    const stream = await this.twitchApiService.getStreamByUsername(username);
    this.logger.log(stream);
    return {
      username,
      isLive: !!stream,
      containsWingull: stream ? this.streamContainsWingull(stream) : false,
      stream,
    };
  }

  private streamContainsWingull(stream: any): boolean {
    const titleContains = stream.title?.toLowerCase().includes('wingull');
    const tagsContain = stream.tags?.some((tag: string) =>
      tag.toLowerCase().includes('wingull'),
    );
    const gameIsPixelmonWingull =
      stream.game_name?.toLowerCase() === 'pixelmon wingull 2';
    return titleContains || tagsContain || gameIsPixelmonWingull;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @Post('monitor/user/:username')
  @ApiOperation({ summary: 'Add user to monitoring list' })
  @ApiResponse({ status: 200, description: 'User added to monitoring' })
  addMonitoredUser(@Param('username') username: string) {
    this.twitchMonitorService.addMonitoredUser(username);
    return {
      message: `User "${username}" added to monitoring list`,
      status: this.twitchMonitorService.getMonitoringStatus(),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @Delete('monitor/user/:username')
  @ApiOperation({ summary: 'Remove user from monitoring list' })
  @ApiResponse({ status: 200, description: 'User removed from monitoring' })
  removeMonitoredUser(@Param('username') username: string) {
    this.twitchMonitorService.removeMonitoredUser(username);
    return {
      message: `User "${username}" removed from monitoring list`,
      status: this.twitchMonitorService.getMonitoringStatus(),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @Post('notifications/target')
  @ApiOperation({ summary: 'Add notification target' })
  @ApiResponse({ status: 200, description: 'Notification target added' })
  addNotificationTarget(@Body() target: NotificationTargetDto) {
    this.notificationService.addTarget(target);
    return {
      message: 'Notification target added successfully',
      targets: this.notificationService.getTargets().length,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @Delete('notifications/target/:type')
  @ApiOperation({ summary: 'Remove notification target' })
  @ApiResponse({ status: 200, description: 'Notification target removed' })
  removeNotificationTarget(@Param('type') type: string) {
    this.notificationService.removeTarget(type);
    return {
      message: `Notification target "${type}" removed`,
      targets: this.notificationService.getTargets().length,
    };
  }
}
