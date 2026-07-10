import { ApiProperty } from '@nestjs/swagger';

export class ForumVoteResult {
  @ApiProperty({
    example: true,
    description: 'Whether the caller now has an active vote on the thread',
  })
  voted: boolean;

  @ApiProperty({
    example: 25,
    description: 'The thread vote count after the toggle (never negative)',
  })
  votes: number;
}
