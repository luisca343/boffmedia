import { ApiProperty } from '@nestjs/swagger';

export class DropRateEntry {
  @ApiProperty({ 
    description: 'Reward name',
    example: 'Gema Roja'
  })
  name: string;

  @ApiProperty({ 
    description: 'Drop rate percentage',
    example: 5.5
  })
  dropRate: number;
}

export class DropRates {
  @ApiProperty({ 
    description: 'Drop rates by reward ID',
    example: {
      1: { name: 'Gema Roja', dropRate: 20 },
      2: { name: 'Gema Verde', dropRate: 20 },
      3: { name: 'Gema Azul', dropRate: 20 },
      4: { name: 'Gema Prisma', dropRate: 15},
      5: { name: 'Gema Blanca', dropRate: 10 },
      6: { name: 'Piedra Teras', dropRate: 10 },
    },
    additionalProperties: {
      $ref: '#/components/schemas/DropRateEntry'
    }
  })
  entries: Record<number, DropRateEntry>;
}