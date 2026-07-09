import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  NotificationEntity,
  UnreadCountEntity,
} from './entities/notification.entity';

@ApiTags('BoffMedia | Notifications')
@ApiBearerAuth('JWT')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's notifications" })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [NotificationEntity] })
  list(@Req() req: any, @Query('limit') limit?: number) {
    return this.service.list(
      req.user.userId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: "Count the current user's unread notifications" })
  @ApiResponse({ status: 200, type: UnreadCountEntity })
  async unreadCount(@Req() req: any) {
    return { count: await this.service.unreadCount(req.user.userId) };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification read' })
  markRead(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.markRead(req.user.userId, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications read' })
  markAllRead(@Req() req: any) {
    return this.service.markAllRead(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(req.user.userId, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all notifications' })
  clear(@Req() req: any) {
    return this.service.clear(req.user.userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiOperation({
    summary:
      'Create a notification for a user, or broadcast to all (admin only)',
  })
  create(@Body() dto: CreateNotificationDto) {
    return this.service.create(dto);
  }
}
