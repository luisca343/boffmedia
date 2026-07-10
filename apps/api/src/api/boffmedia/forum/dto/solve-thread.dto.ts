import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class SolveThreadDto {
  @ApiPropertyOptional({
    example: 42,
    description:
      'Id of the post to mark as the solution. Omit (or null) to unsolve the thread.',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  postId?: number;
}
