import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetLockedDto {
  @ApiProperty({ example: true, description: 'Whether the thread is locked' })
  @IsBoolean()
  locked: boolean;
}
