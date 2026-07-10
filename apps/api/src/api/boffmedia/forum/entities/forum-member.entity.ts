import { ApiProperty } from '@nestjs/swagger';
import { ForumAuthor } from './forum-author.entity';

export class ForumMember extends ForumAuthor {
  @ApiProperty({
    example: 'online',
    enum: ['online', 'idle', 'offline'],
    description: 'Presence status',
  })
  status: 'online' | 'idle' | 'offline';
}
