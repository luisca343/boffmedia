import { ApiProperty } from '@nestjs/swagger';
import { QuestRequirements } from './quest.entity';

export class Dialogue {
  @ApiProperty({
    description: 'Dialogue ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Dialogue name/title',
    example: 'Professor Oak Introduction',
  })
  name: string;

  @ApiProperty({
    description: 'Dialogue text content',
    example: 'Welcome to the world of Pokemon!',
  })
  text: string;

  @ApiProperty({
    description: 'Associated quest ID',
    example: 1,
  })
  questId: number;

  @ApiProperty({
    description: 'Dialogue requirements',
    type: QuestRequirements,
  })
  requirements: QuestRequirements;
}
