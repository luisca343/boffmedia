import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetQuestsDto extends BaseDto {
  @ApiProperty({
    description: 'Force cache refresh (1 to force, 0 for normal)',
    example: 0,
    required: false,
    enum: [0, 1],
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsIn([0, 1])
  force?: number = 0;
}
