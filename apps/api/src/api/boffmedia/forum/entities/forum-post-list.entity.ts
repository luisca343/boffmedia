import { ApiProperty } from '@nestjs/swagger';
import { ForumPost } from './forum-post.entity';

export class ForumPostList {
  @ApiProperty({ type: [ForumPost], description: 'Posts on this page' })
  items: ForumPost[];

  @ApiProperty({ example: 42, description: 'Total posts in the thread' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page (1-based)' })
  page: number;

  @ApiProperty({ example: 20, description: 'Page size' })
  pageSize: number;
}
