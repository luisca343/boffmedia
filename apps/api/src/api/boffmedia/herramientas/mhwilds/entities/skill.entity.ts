import { ApiProperty } from '@nestjs/swagger';

export class SkillEntity {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the skill',
  })
  id: number;

  @ApiProperty({
    example: 'Attack Boost',
    description: 'Name of the skill',
  })
  name: string;

  @ApiProperty({
    example: 'Increases attack power',
    description: 'Description of the skill effect',
  })
  description: string;

  @ApiProperty({
    example: 7,
    description: 'Maximum level for this skill',
  })
  maxLevel: number;

  @ApiProperty({
    description: 'Effect descriptions for each level',
    example: ['Attack +3', 'Attack +6', 'Attack +9'],
    type: [String],
  })
  levels: string[];
}
