import { ApiProperty } from '@nestjs/swagger';
import { ForumAuthor } from './forum-author.entity';

export class ForumCategory {
  @ApiProperty({ example: 1, description: 'Category id' })
  id: number;

  @ApiProperty({ example: 'general', description: 'URL slug (unique)' })
  slug: string;

  @ApiProperty({ example: 'General', description: 'Category name' })
  name: string;

  @ApiProperty({
    example: 'Charla general de la comunidad',
    description: 'Category description',
  })
  description: string;

  @ApiProperty({ example: 'message-circle', description: 'Icon name' })
  icon: string;

  @ApiProperty({ example: 28, description: 'Display hue (0-360)' })
  hue: number;

  @ApiProperty({ example: false, description: 'Whether the category is locked' })
  locked: boolean;

  @ApiProperty({ example: 12, description: 'Non-deleted thread count' })
  threads: number;

  @ApiProperty({ example: 84, description: 'Non-deleted post count' })
  posts: number;

  @ApiProperty({
    type: ForumAuthor,
    nullable: true,
    required: false,
    description: 'Author of the most recent activity in the category',
  })
  lastAuthor: ForumAuthor | null;

  @ApiProperty({
    example: '2026-07-09T12:00:00.000Z',
    type: Date,
    nullable: true,
    required: false,
    description: 'Timestamp of the most recent activity in the category',
  })
  lastAt: Date | null;
}
