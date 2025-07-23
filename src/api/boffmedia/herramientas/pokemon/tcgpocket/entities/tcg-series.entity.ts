import { ApiProperty } from '@nestjs/swagger';

export class TcgSeries {
  @ApiProperty({ example: 'base', description: 'Series ID' })
  id: string;

  @ApiProperty({ example: 'Base', description: 'Series name (EN)' })
  name_en: string;

  @ApiProperty({ example: 'Base', description: 'Series name (ES)' })
  name_es: string;

  @ApiProperty({ example: 'https://assets.tcgdex.net/en/base/base1/logo', description: 'Logo URL', required: false })
  logo?: string;
}
