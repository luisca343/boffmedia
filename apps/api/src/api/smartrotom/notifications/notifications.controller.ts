import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { NotificationsService } from './notifications.service';
import {
  GetInboxQueryDto,
  MarkReadBodyDto,
  NotificationsInboxDto,
  NotificationResponseDto,
  SendNotificationDto,
} from './notifications.dto';

@ApiTags('SmartRotom | Notifications')
@Controller('smartrotom/notifications')
@UseInterceptors(ResponseInterceptor)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch notification inbox for a user' })
  @ApiQuery({ name: 'uuid', description: 'User UUID' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification inbox',
    type: NotificationsInboxDto,
  })
  async getInbox(
    @Query() query: GetInboxQueryDto,
  ): Promise<NotificationsInboxDto> {
    const limit = query.limit ? Number(query.limit) : 20;
    const offset = query.offset ? Number(query.offset) : 0;
    return this.notificationsService.getInbox(
      query.uuid,
      limit,
      offset,
    ) as unknown as NotificationsInboxDto;
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read',
  })
  async markRead(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: MarkReadBodyDto,
  ): Promise<void> {
    return this.notificationsService.markRead(id, body.uuid);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read',
  })
  async markAllRead(@Body() body: MarkReadBodyDto): Promise<void> {
    return this.notificationsService.markAllRead(body.uuid);
  }

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a notification to a player (admin)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification created and delivered',
    type: NotificationResponseDto,
  })
  async send(
    @Body() dto: SendNotificationDto,
  ): Promise<NotificationResponseDto> {
    const result = await this.notificationsService.createNotification({
      userUuid: dto.userUuid,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      link: dto.link,
    });
    return result as unknown as NotificationResponseDto;
  }
}
