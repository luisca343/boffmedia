import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsIn,
  IsBoolean,
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

  @ApiPropertyOptional({
    example: 'gen9championsvgc2026regma',
    description:
      '@pkmn/sim format ID. Defaults to `id` when omitted. Must resolve in ' +
      'the Dex or the request is rejected with 400.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  formatId?: string;

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
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  vgcPastesGid?: string | null;

  @ApiPropertyOptional({
    example: true,
    description:
      'Soft-disable switch. false hides the regulation from every picker ' +
      'without deleting its imported data. Defaults to true.',
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
