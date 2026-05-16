import { ApiProperty } from '@nestjs/swagger';
import { QuestRequirements } from './quest.entity';

export class NPC {
  @ApiProperty({
    description: 'NPC ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'NPC name',
    example: 'Professor Oak',
  })
  name: string;

  @ApiProperty({
    description: 'NPC dialogue text',
    example: 'Hello there! Welcome to the Pokemon world!',
  })
  text: string;

  @ApiProperty({
    description: 'Associated quest ID',
    example: 1,
  })
  questId: number;

  @ApiProperty({
    description: 'NPC requirements',
    type: QuestRequirements,
  })
  requirements: QuestRequirements;
}
