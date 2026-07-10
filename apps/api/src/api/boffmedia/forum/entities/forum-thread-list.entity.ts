import { ApiProperty } from '@nestjs/swagger';
import { ForumThread } from './forum-thread.entity';

export class ForumThreadList {
  @ApiProperty({ type: [ForumThread], description: 'Threads on this page' })
  items: ForumThread[];

  @ApiProperty({ example: 42, description: 'Total matching threads' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page (1-based)' })
  page: number;

  @ApiProperty({ example: 20, description: 'Page size' })
  pageSize: number;
}
