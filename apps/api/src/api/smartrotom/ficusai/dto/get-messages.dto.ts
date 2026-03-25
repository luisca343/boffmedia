import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMessagesDto extends BaseDto {
  @ApiProperty({ 
    description: 'UUID of the player/user',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    required: true
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ 
    description: 'Number of messages to retrieve',
    example: 20,
    required: false,
    minimum: 1,
    maximum: 100,
    type: Number
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}