import { ApiProperty } from '@nestjs/swagger';
import { SmartrotomRequestDto } from './smartrotom-request-dto';

export class NpcImageDto extends SmartrotomRequestDto {
  @ApiProperty({ description: 'Name of the NPC' })
  npcName: string;

  @ApiProperty({ description: 'Image of the NPC' })
  image: string;
}
