import { ApiProperty } from '@nestjs/swagger';

export class DecorationEntity {
  @ApiProperty({ 
    example: 1, 
    description: 'Unique identifier for the decoration' 
  })
  id: number;

  @ApiProperty({ 
    example: 'Attack Jewel', 
    description: 'Name of the decoration' 
  })
  name: string;

  @ApiProperty({ 
    example: 'Increases attack power when slotted', 
    description: 'Description of the decoration effect' 
  })
  description: string;

  @ApiProperty({ 
    example: 1, 
    description: 'Slot size required for this decoration' 
  })
  slotSize: number;

  @ApiProperty({ 
    example: 2, 
    description: 'Rarity level of the decoration' 
  })
  rarity: number;

  @ApiProperty({ 
    description: 'Skills provided by the decoration',
    example: [{ name: 'Attack Boost', level: 1 }],
    type: [Object]
  })
  skills: any[];
}