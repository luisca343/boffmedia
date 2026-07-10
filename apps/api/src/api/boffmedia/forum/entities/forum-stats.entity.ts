import { ApiProperty } from '@nestjs/swagger';

export class ForumStats {
  @ApiProperty({ example: 1240, description: 'Total non-deleted posts' })
  posts: number;

  @ApiProperty({ example: 312, description: 'Total non-deleted threads' })
  threads: number;

  @ApiProperty({ example: 875, description: 'Total non-deleted members' })
  members: number;

  @ApiProperty({ example: 14, description: 'Members active in the last 5 minutes' })
  online: number;

  @ApiProperty({ example: 'Nautilus', description: 'Username of the newest member' })
  newest: string;
}
