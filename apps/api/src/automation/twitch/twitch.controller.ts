import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TwitchMonitorService } from './services/twitch-monitor.service';
import { TwitchApiService } from './services/twitch-api.service';
import { NotificationService } from './services/notification.service';
import { NotificationTarget } from './interfaces/notification.interface';

@ApiTags('Automation - Twitch')
@Controller('automation/twitch')
export class TwitchController {
  constructor(
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
    console.log(stream);
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

  @Post('notifications/target')
  @ApiOperation({ summary: 'Add notification target' })
  @ApiResponse({ status: 200, description: 'Notification target added' })
  addNotificationTarget(@Body() target: NotificationTarget) {
    this.notificationService.addTarget(target);
    return {
      message: 'Notification target added successfully',
      targets: this.notificationService.getTargets().length,
    };
  }

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
