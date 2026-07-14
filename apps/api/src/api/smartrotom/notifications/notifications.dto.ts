import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Recipient user UUID' })
  userUuid: string;

  @ApiProperty({
    description: 'Notification type (chatapp, starbank, arcade, misiones, …)',
    example: 'chatapp',
  })
  type: string;

  @ApiProperty({
    description: 'Short notification title',
    example: 'New message from Ash',
  })
  title: string;

  @ApiProperty({ description: 'Notification body text' })
  body: string;

  @ApiProperty({
    description: 'Optional deep-link URL',
    type: String,
    nullable: true,
    required: false,
  })
  link: string | null;

  @ApiProperty({
    description: 'Whether the notification has been read',
    example: 0,
  })
  isRead: number;

  @ApiProperty({
    description: 'Creation timestamp',
    type: String,
    format: 'date-time',
  })
  createdAt: Date | null;
}

export class NotificationsInboxDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  items: NotificationResponseDto[];

  @ApiProperty({
    description: 'Total number of notifications for the user',
    example: 42,
  })
  total: number;
}

export class GetInboxQueryDto {
  @ApiProperty({ description: 'User UUID' })
  @IsString()
  @IsNotEmpty()
  uuid: string;

  @ApiProperty({
    description: 'Max results to return',
    example: 20,
    required: false,
  })
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Pagination offset',
    example: 0,
    required: false,
  })
  @IsOptional()
  offset?: number;
}

export class MarkReadBodyDto extends BaseDto {
  @ApiProperty({ description: 'User UUID' })
  @IsString()
  @IsNotEmpty()
  uuid: string;
}

export class SendNotificationDto extends BaseDto {
  @ApiProperty({ description: 'Recipient user UUID' })
  @IsString()
  @IsNotEmpty()
  userUuid: string;

  @ApiProperty({
    description: 'Notification type (chatapp, starbank, system, …)',
    example: 'system',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  type: string;

  @ApiProperty({
    description: 'Short notification title',
    example: 'Mensaje del servidor',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Notification body text' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Optional deep-link URL',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  link?: string;
}
