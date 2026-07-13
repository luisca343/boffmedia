import { ApiProperty } from '@nestjs/swagger';
import { ForumAuthor } from './forum-author.entity';

export class ForumPost {
  @ApiProperty({ example: 1, description: 'Post id' })
  id: number;

  @ApiProperty({ example: 1, description: 'Thread id this post belongs to' })
  threadId: number;

  @ApiProperty({ type: ForumAuthor, description: 'Post author' })
  author: ForumAuthor;

  @ApiProperty({
    example: 'Prueba a subir la velocidad base...',
    description: 'Post body (markdown)',
  })
  body: string;

  @ApiProperty({
    example: false,
    description: 'Whether this post is the accepted solution',
  })
  isSolution: boolean;

  @ApiProperty({
    example: true,
    description:
      'Whether this post is the original post (earliest in the thread)',
  })
  isOp: boolean;

  @ApiProperty({
    example: '2026-07-01T09:00:00.000Z',
    type: Date,
    description: 'When the post was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-07-01T09:00:00.000Z',
    type: Date,
    description: 'When the post was last updated',
  })
  updatedAt: Date;
}
