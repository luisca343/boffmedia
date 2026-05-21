import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsNumber,
  IsString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class NPCData {
  @ApiProperty({ description: 'NPC ID', example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'NPC name', example: 'Professor Oak' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'NPC text',
    example: 'Hello there!',
    required: false,
  })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({ description: 'Quest ID', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  questId?: number;
}

export class UpdateNPCsDto extends BaseDto {
  @ApiProperty({
    description: 'Array of NPC objects',
    type: [NPCData],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NPCData)
  npcs: NPCData[];
}
