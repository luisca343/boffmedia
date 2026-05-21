import { ApiProperty } from '@nestjs/swagger';

export class TcgSet {
  @ApiProperty({ example: 'A1', description: 'Set ID' })
  id: string;

  @ApiProperty({ example: 'Genetic Apex', description: 'Set name' })
  name: string;

  @ApiProperty({
    example: 'https://assets.tcgdex.net/en/tcgp/A1/logo',
    description: 'Logo URL',
    required: false,
  })
  logo?: string;

  @ApiProperty({
    example: 'https://assets.tcgdex.net/univ/tcgp/A1/symbol',
    description: 'Symbol URL',
    required: false,
  })
  symbol?: string;

  @ApiProperty({ example: 226, description: 'Official card count' })
  cardCountOfficial: number;

  @ApiProperty({ example: 286, description: 'Total card count' })
  cardCountTotal: number;
}
