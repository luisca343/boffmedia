import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class TcgSeriesDto {
  @ApiProperty({ description: 'Series ID', example: 'base' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Series name (EN)', example: 'Base' })
  @IsString()
  name_en: string;

  @ApiProperty({ description: 'Series name (ES)', example: 'Base' })
  @IsString()
  name_es: string;

  @ApiProperty({
    description: 'Logo URL',
    example: 'https://assets.tcgdex.net/en/base/base1/logo',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  logo?: string;
}
