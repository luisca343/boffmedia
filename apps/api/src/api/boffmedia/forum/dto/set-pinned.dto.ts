import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetPinnedDto {
  @ApiProperty({ example: true, description: 'Whether the thread is pinned' })
  @IsBoolean()
  pinned: boolean;
}
