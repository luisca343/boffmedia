import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';
import { PagedQueryDto } from '../../_shared/dto/paged-query.dto';

// ==================== EVENTOS ====================

export class EventoWeightsDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  tamano?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  ivs?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  shiny?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  nivel?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  especie?: number;
}

export class CreateEventoDto extends BaseDto {
  @ApiProperty({ enum: ['construccion', 'caza'] })
  @IsEnum(['construccion', 'caza'] as const)
  type: 'construccion' | 'caza';

  @ApiProperty({ example: 'Concurso de construcción — Verano 2026' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brief?: string;

  @ApiPropertyOptional({ example: '10.000₽ y rango especial' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  prize?: string;

  @ApiPropertyOptional({ example: 'Departamento de Eventos' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  crew?: string;

  @ApiPropertyOptional({ description: 'construcción: when submissions close' })
  @IsOptional()
  @IsDateString()
  buildClosedAt?: string;

  @ApiPropertyOptional({
    description: 'construcción: when public rating opens',
  })
  @IsOptional()
  @IsDateString()
  ratingOpensAt?: string;

  @ApiPropertyOptional({
    description: 'construcción: when public rating closes',
  })
  @IsOptional()
  @IsDateString()
  ratingClosesAt?: string;

  @ApiPropertyOptional({
    example: 'pueblo_mizu',
    description: 'caza: hunting zone',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  zone?: string;

  @ApiPropertyOptional({ type: Number, description: 'caza: center X' })
  @IsOptional()
  @IsInt()
  coordsX?: number;

  @ApiPropertyOptional({ type: Number, description: 'caza: center Z' })
  @IsOptional()
  @IsInt()
  coordsZ?: number;

  @ApiPropertyOptional({ type: Number, description: 'caza: radius in blocks' })
  @IsOptional()
  @IsInt()
  radius?: number;

  @ApiPropertyOptional({ description: 'caza: when the hunt opens' })
  @IsOptional()
  @IsDateString()
  opensAt?: string;

  @ApiPropertyOptional({ description: 'caza: when the hunt closes' })
  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rules?: string;

  @ApiPropertyOptional({
    type: EventoWeightsDto,
    description: 'caza: public scoring weights',
  })
  @IsOptional()
  @IsObject()
  weights?: EventoWeightsDto;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  createdBy: string;
}

export class UpdateEventoDto extends PartialType(
  OmitType(CreateEventoDto, ['type', 'createdBy'] as const),
) {
  @ApiPropertyOptional({ enum: ['upcoming', 'live', 'closed'] })
  @IsOptional()
  @IsEnum(['upcoming', 'live', 'closed'] as const)
  status?: 'upcoming' | 'live' | 'closed';

  @ApiPropertyOptional({
    example: 'pueblo_mizu',
    description: 'construcción: winning town',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  winnerTown?: string;
}

export class ListEventosQueryDto {
  @ApiPropertyOptional({ enum: ['construccion', 'caza'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

// ==================== OBRAS ====================

export class CreateObraDto extends BaseDto {
  @ApiProperty({ example: 'pueblo_mizu' })
  @IsString()
  @MaxLength(64)
  town: string;

  @ApiProperty({ example: 'El Faro de Cristal' })
  @IsString()
  @MaxLength(255)
  buildName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String], description: 'UUIDs of the builders' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  builders?: string[];

  @ApiPropertyOptional({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Officer performing the action, for the audit log',
  })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

export class UpdateObraDto extends PartialType(CreateObraDto) {}

export class VoteObraDto extends BaseDto {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  voterUuid: string;

  @ApiProperty({ example: 8, minimum: 0, maximum: 10 })
  @IsInt()
  @Min(0)
  @Max(10)
  diseno: number;

  @ApiProperty({ example: 7, minimum: 0, maximum: 10 })
  @IsInt()
  @Min(0)
  @Max(10)
  ambicion: number;

  @ApiProperty({ example: 9, minimum: 0, maximum: 10 })
  @IsInt()
  @Min(0)
  @Max(10)
  fidelidad: number;
}

// ==================== ESPECIES ====================

export class CreateEspecieDto extends BaseDto {
  @ApiProperty({ example: 'Charizard' })
  @IsString()
  @MaxLength(64)
  name: string;

  @ApiProperty({ example: 'legendaria' })
  @IsString()
  @MaxLength(32)
  rarity: string;

  @ApiPropertyOptional({ example: 50, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  rarityPts?: number = 0;

  @ApiPropertyOptional({ example: 2.5, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  spawnPct?: number = 0;

  @ApiPropertyOptional({ example: 0.5, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shinyPct?: number = 0;

  @ApiPropertyOptional({ example: 20, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  lvlMin?: number = 1;

  @ApiPropertyOptional({ example: 45, default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  lvlMax?: number = 100;

  @ApiPropertyOptional({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Officer performing the action, for the audit log',
  })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

export class UpdateEspecieDto extends PartialType(CreateEspecieDto) {}

// ==================== CAPTURAS ====================

export class RegisterCapturaDto extends BaseDto {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  uuid: string;

  @ApiProperty({ example: 'Charizard' })
  @IsString()
  @MaxLength(64)
  species: string;

  @ApiProperty({ example: 42 })
  @IsInt()
  @Min(1)
  @Max(100)
  level: number;

  @ApiProperty({ example: 155 })
  @IsInt()
  @Min(0)
  ivsTotal: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  shiny?: boolean = false;

  @ApiPropertyOptional({ example: 1.8, type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  size?: number;
}

export class ListCapturasQueryDto extends PagedQueryDto {}
