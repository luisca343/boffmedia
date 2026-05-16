import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUrl } from 'class-validator';

export class TcgSetDto {
  @ApiProperty({ description: 'Set ID', example: 'A1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Set name', example: 'Genetic Apex' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Logo URL',
    example: 'https://assets.tcgdex.net/en/tcgp/A1/logo',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiProperty({
    description: 'Symbol URL',
    example: 'https://assets.tcgdex.net/univ/tcgp/A1/symbol',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  symbol?: string;

  @ApiProperty({ description: 'Official card count', example: 226 })
  @IsNumber()
  cardCountOfficial: number;

  @ApiProperty({ description: 'Total card count', example: 286 })
  @IsNumber()
  cardCountTotal: number;
}
