import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUrl } from 'class-validator';

export class TcgCardDto {
  @ApiProperty({ description: 'Card ID', example: 'tcgp-A1-001' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Local ID within set', example: '001' })
  @IsString()
  localId: string;

  @ApiProperty({ description: 'Card name (EN)', example: 'Pikachu' })
  @IsString()
  name_en: string;

  @ApiProperty({ description: 'Card name (ES)', example: 'Pikachu' })
  @IsString()
  name_es: string;

  @ApiProperty({
    description: 'Card image URL (EN)',
    example: 'https://...',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  image_local_en?: string;

  @ApiProperty({
    description: 'Card image URL (ES)',
    example: 'https://...',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  image_local_es?: string;

  @ApiProperty({ description: 'Card category', example: 'Pokemon' })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Card illustrator',
    example: 'Atsuko Nishida',
    required: false,
  })
  @IsOptional()
  @IsString()
  illustrator?: string;

  @ApiProperty({ description: 'Card rarity', example: 'Common' })
  @IsString()
  rarity: string;

  @ApiProperty({ description: 'Pokemon HP', example: 60, required: false })
  @IsOptional()
  @IsNumber()
  hp?: number;

  @ApiProperty({
    description: 'Pokemon stage',
    example: 'Basic',
    required: false,
  })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiProperty({ description: 'Card description (EN)', required: false })
  @IsOptional()
  @IsString()
  description_en?: string;

  @ApiProperty({ description: 'Card description (ES)', required: false })
  @IsOptional()
  @IsString()
  description_es?: string;

  @ApiProperty({ description: 'Set ID this card belongs to', example: 'A1' })
  @IsString()
  setId: string;
}
