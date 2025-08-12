import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class CheckImageDto extends BaseDto {
  @ApiProperty({ 
    description: 'NPC name to check',
    example: 'professor_oak'
  })
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'NPC name can only contain letters, numbers, underscores, and hyphens'
  })
  npcName: string;
}