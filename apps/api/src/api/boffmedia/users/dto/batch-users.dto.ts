import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class BatchUsersDto {
  @ApiProperty({
    type: Number,
    isArray: true,
    example: [1, 2, 3],
    description: 'Array of user IDs to fetch',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];
}
