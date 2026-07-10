import { ApiProperty } from '@nestjs/swagger';
import { ForumAuthor } from './forum-author.entity';

export class ForumThread {
  @ApiProperty({ example: 1, description: 'Thread id' })
  id: number;

  @ApiProperty({ example: 'general', description: 'Category slug' })
  catSlug: string;

  @ApiProperty({ example: 'General', description: 'Category name' })
  catName: string;

  @ApiProperty({ example: 28, description: 'Category display hue' })
  catHue: number;

  @ApiProperty({
    example: '¿Cómo optimizo mi equipo?',
    description: 'Thread title',
  })
  title: string;

  @ApiProperty({ type: ForumAuthor, description: 'Thread author (OP)' })
  author: ForumAuthor;

  @ApiProperty({
    type: ForumAuthor,
    nullable: true,
    required: false,
    description: 'Author of the last post (null when there are no replies)',
  })
  lastAuthor: ForumAuthor | null;

  @ApiProperty({
    example: '2026-07-09T12:00:00.000Z',
    type: Date,
    nullable: true,
    required: false,
    description: 'Timestamp of the last post',
  })
  lastAt: Date | null;

  @ApiProperty({
    example: '2026-07-01T09:00:00.000Z',
    type: Date,
    description: 'When the thread was created',
  })
  createdAt: Date;

  @ApiProperty({ example: false, description: 'Whether the thread is pinned' })
  pinned: boolean;

  @ApiProperty({ example: false, description: 'Whether the thread is locked' })
  locked: boolean;

  @ApiProperty({ example: false, description: 'Whether the thread is solved' })
  solved: boolean;

  @ApiProperty({ example: 8, description: 'Reply count (excludes the OP)' })
  replies: number;

  @ApiProperty({ example: 152, description: 'View count' })
  views: number;

  @ApiProperty({ example: 24, description: 'Vote count' })
  votes: number;
}
