import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsIn,
} from 'class-validator';

export class UpsertRegulationDto {
  @ApiProperty({
    example: 'vgc2026regma',
    description: 'Unique regulation ID (matches Drizzle PK)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  id!: string;

  @ApiProperty({
    example: 'gen9championsvgc2026regma',
    description: '@pkmn/sim format ID',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  formatId!: string;

  @ApiProperty({
    example: '[Gen 9 Champions] VGC 2026 Reg M-A',
    description: 'Display name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'doubles', enum: ['singles', 'doubles'] })
  @IsOptional()
  @IsString()
  @IsIn(['singles', 'doubles'])
  gameType?: string;

  @ApiPropertyOptional({
    example: '791705272',
    description: 'Google Sheet GID for VGCPastes data (null = no sheet)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  vgcPastesGid?: string | null;
}
