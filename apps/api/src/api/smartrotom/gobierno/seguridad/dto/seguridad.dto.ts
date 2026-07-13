import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';
import { PagedQueryDto } from '../../_shared/dto/paged-query.dto';

export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export const BITACORA_TONES = ['ok', 'warn', 'danger', 'info'] as const;

// ==================== DENUNCIAS ====================

export class CreateDenunciaDto extends BaseDto {
  @ApiPropertyOptional({ example: 'pueblo_mizu' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  town?: string;

  @ApiPropertyOptional({ example: 4, type: Number })
  @IsOptional()
  @IsInt()
  plotNumber?: number;

  @ApiPropertyOptional({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsOptional()
  @IsUUID()
  accusedUuid?: string;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  reporterUuid: string;

  @ApiProperty({ example: 'ruido', description: 'Free-form category' })
  @IsString()
  @MaxLength(32)
  category: string;

  @ApiProperty({ example: 'Fuegos artificiales a las 3am junto a mi parcela' })
  @IsString()
  description: string;
}

export class UpdateDenunciaDto extends PartialType(
  OmitType(CreateDenunciaDto, ['reporterUuid'] as const),
) {
  @ApiPropertyOptional({
    enum: ['reviewing'],
    description:
      'An officer picking up a pending denuncia sets it to reviewing',
  })
  @IsOptional()
  @IsEnum(['reviewing'] as const)
  status?: 'reviewing';
}

export class ResolveDenunciaDto extends BaseDto {
  @ApiProperty({ enum: ['resolved', 'dismissed'] })
  @IsEnum(['resolved', 'dismissed'] as const)
  status: 'resolved' | 'dismissed';

  @ApiProperty({ example: 'Advertencia verbal emitida' })
  @IsString()
  resolution: string;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  resolvedBy: string;
}

export class ListDenunciasQueryDto extends PagedQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  town?: string;

  @ApiPropertyOptional({ description: 'Filter by accused player uuid' })
  @IsOptional()
  @IsUUID()
  accused?: string;

  @ApiPropertyOptional({ description: 'Filter by reporter uuid' })
  @IsOptional()
  @IsUUID()
  reporter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

// ==================== BUSCADOS ====================

export class CreateBuscadoDto extends BaseDto {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  playerUuid: string;

  @ApiProperty({ enum: SEVERITY_LEVELS })
  @IsEnum(SEVERITY_LEVELS)
  severity: (typeof SEVERITY_LEVELS)[number];

  @ApiPropertyOptional({ example: 500, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bounty?: number = 0;

  @ApiProperty({ example: 'Robo de mercancía en tienda del pueblo' })
  @IsString()
  @MaxLength(255)
  offense: string;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  reportedBy: string;

  @ApiPropertyOptional({ example: 'pueblo_mizu, cerca del puerto' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  lastSeen?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBuscadoDto extends PartialType(
  OmitType(CreateBuscadoDto, ['playerUuid', 'reportedBy'] as const),
) {}

export class CaptureBuscadoDto extends BaseDto {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  capturedBy: string;
}

export class ListBuscadosQueryDto extends PagedQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: SEVERITY_LEVELS })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional({ description: 'Filter by wanted player uuid' })
  @IsOptional()
  @IsUUID()
  player?: string;
}

// ==================== PATRULLAS ====================

export class CreatePatrullaDto extends BaseDto {
  @ApiProperty({ example: 'Ronda nocturna — Mizu' })
  @IsString()
  @MaxLength(64)
  label: string;

  @ApiProperty({ example: '22:00' })
  @IsString()
  @MaxLength(8)
  fromTime: string;

  @ApiProperty({ example: '06:00' })
  @IsString()
  @MaxLength(8)
  toTime: string;

  @ApiPropertyOptional({ example: 'pueblo_mizu' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  zone?: string;

  @ApiPropertyOptional({ enum: ['active', 'rest'], default: 'rest' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  status?: string = 'rest';

  @ApiPropertyOptional({
    type: [String],
    description: 'UUIDs of the officers assigned',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  officers?: string[];

  @ApiPropertyOptional({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Officer performing the action, for the audit log',
  })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

export class UpdatePatrullaDto extends PartialType(CreatePatrullaDto) {}

export class ListPatrullasQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

// ==================== BITACORA ====================

export class CreateBitacoraDto extends BaseDto {
  @ApiPropertyOptional({ example: 3, type: Number })
  @IsOptional()
  @IsInt()
  patrullaId?: number;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  uuid: string;

  @ApiProperty({ example: 'Ronda completada sin incidencias' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ enum: BITACORA_TONES, default: 'info' })
  @IsOptional()
  @IsEnum(BITACORA_TONES)
  tone?: (typeof BITACORA_TONES)[number] = 'info';
}

export class ListBitacoraQueryDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  patrullaId?: number;

  @ApiPropertyOptional({ enum: BITACORA_TONES })
  @IsOptional()
  @IsString()
  tone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
