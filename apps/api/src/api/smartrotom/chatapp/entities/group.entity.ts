import { ApiProperty } from '@nestjs/swagger';
import { ChatMessage, ChatMember } from './chat.entity';

export class Group {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Group Name' })
  name: string;

  @ApiProperty({ example: 3 })
  type: number;

  @ApiProperty({ example: 'Group description' })
  description: string;

  @ApiProperty({ example: '/smartrotom/img/apps/chatapp/default.webp' })
  image: string;

  @ApiProperty({ example: '2025-06-13T23:06:15.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-06-13T23:06:15.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: [ChatMessage], example: [] })
  messages: ChatMessage[];

  @ApiProperty({ example: 0 })
  unread: number;

  @ApiProperty({ type: [ChatMember], example: [] })
  members: ChatMember[];

  @ApiProperty({
    example: 'online',
    description: 'Presence of the counterpart (direct chats only)',
    enum: ['online', 'ingame', 'offline'],
    required: false,
  })
  presence?: 'online' | 'ingame' | 'offline';

  @ApiProperty({
    example: false,
    description: 'Whether the requesting user pinned this chat',
    required: false,
  })
  pinned?: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the requesting user muted this chat',
    required: false,
  })
  muted?: boolean;
}
