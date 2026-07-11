import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class TeamsheetMonDto {
  @ApiPropertyOptional({ description: 'Slot number (1-6).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  slot?: number;

  @ApiPropertyOptional({ description: 'National dex number (sprite lookup).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dex?: number;

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  item?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ability?: string;

  @ApiPropertyOptional({ description: 'Tera type.' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  tera?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @MaxLength(48, { each: true })
  moves: string[];
}

/** Open teamsheet of one entrant (visible to their current-round opponent). */
export class TeamsheetDto {
  @ApiProperty({ type: [TeamsheetMonDto] })
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => TeamsheetMonDto)
  mons: TeamsheetMonDto[];
}
