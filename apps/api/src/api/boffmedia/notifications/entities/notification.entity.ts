import { ApiProperty } from '@nestjs/swagger';

export class NotificationEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 42 })
  userId: number;

  @ApiProperty({
    enum: ['event', 'achievement', 'tournament', 'forum', 'system'],
    example: 'system',
  })
  type: 'event' | 'achievement' | 'tournament' | 'forum' | 'system';

  @ApiProperty({ example: 'Nuevo evento disponible' })
  title: string;

  @ApiProperty({ nullable: true, example: 'El torneo de verano ya está abierto.' })
  body: string | null;

  @ApiProperty({ nullable: true, example: '/eventos/12' })
  link: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  readAt: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;
}

export class UnreadCountEntity {
  @ApiProperty({ example: 3 })
  count: number;
}
