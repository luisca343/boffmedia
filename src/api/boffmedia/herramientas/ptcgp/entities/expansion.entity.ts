import { ApiProperty } from '@nestjs/swagger';

export class ExpansionEntity {
  @ApiProperty({ 
    example: 'genetic-apex', 
    description: 'Expansion identifier' 
  })
  id: string;

  @ApiProperty({ 
    example: 'Genetic Apex', 
    description: 'Expansion name' 
  })
  name: string;

  @ApiProperty({ 
    example: 'https://example.com/logo.png', 
    description: 'Logo image URL',
    nullable: true 
  })
  logoUrl: string | null;

  @ApiProperty({ 
    example: 'https://example.com/icon.png', 
    description: 'Icon image URL',
    nullable: true 
  })
  iconUrl: string | null;

  @ApiProperty({ 
    example: 'main', 
    description: 'Expansion type',
    enum: ['main', 'promo']
  })
  type: string;

  @ApiProperty({ 
    example: '2024-10-30T00:00:00Z', 
    description: 'Release date',
    nullable: true 
  })
  releaseDate: Date | null;
}