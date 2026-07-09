import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSuggestionDto {
  @ApiProperty({ example: 'Torneo de verano VGC' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Pokémon VGC' })
  @IsString()
  @MaxLength(255)
  gameName: string;

  @ApiProperty({ example: 'tournament' })
  @IsString()
  @MaxLength(64)
  type: string;

  @ApiProperty({ example: 'Un torneo abierto para toda la comunidad.' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'Formato BO3, regulación H.' })
  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @ApiPropertyOptional({ example: '2026-08-01T17:00:00Z' })
  @IsOptional()
  @IsDateString()
  suggestedDate?: string;

  @ApiPropertyOptional({ example: '2026-08-02T21:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 64 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxParticipants?: number;
}
