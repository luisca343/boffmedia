import { ApiProperty } from '@nestjs/swagger';

export class ArceuSpeakEntity {
  @ApiProperty({ example: 1, description: 'Database ID', required: false })
  id?: number;

  @ApiProperty({ example: 'arceus', description: 'Character name' })
  name: string;

  @ApiProperty({
    example: 'https://...',
    description: 'Character voice or asset value',
  })
  value: string;

  @ApiProperty({ example: 'mp3', description: 'Audio or asset format' })
  format: string;
}
