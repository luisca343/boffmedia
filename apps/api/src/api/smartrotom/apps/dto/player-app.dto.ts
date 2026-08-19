import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class PlayerAppDto extends BaseDto {
  @ApiProperty({
    description: 'The id of the app',
    example: 12,
  })
  @IsInt()
  @Min(1)
  id: number;
}
