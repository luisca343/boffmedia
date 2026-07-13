import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';

// ==================== NPC SKINS ====================

export class CreateNpcSkinDto extends BaseDto {
  @ApiProperty({ example: 'oficial_teras' })
  @IsString()
  @MaxLength(64)
  skin: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'NPC identifiers wearing this skin',
  })
  @IsOptional()
  @IsArray()
  npcs?: string[];

  @ApiPropertyOptional({ example: 0, default: 0, type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  src?: number = 0;

  @ApiPropertyOptional({ example: 0, default: 0, type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  face?: number = 0;

  @ApiPropertyOptional({ example: 0, default: 0, type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  head?: number = 0;

  @ApiPropertyOptional({ example: 0, default: 0, type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  body?: number = 0;

  @ApiPropertyOptional({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Officer performing the action, for the audit log',
  })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

export class UpdateNpcSkinDto extends PartialType(
  OmitType(CreateNpcSkinDto, ['skin'] as const),
) {}

// ==================== MEGAFONIA ====================

export class SendMegafoniaDto extends BaseDto {
  @ApiProperty({ example: 'Alcaldía de Teras' })
  @IsString()
  @MaxLength(64)
  speaker: string;

  @ApiProperty({ example: 'Recordatorio: el mercado cierra a las 22:00' })
  @IsString()
  text: string;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  byUuid: string;
}

export class ListMegafoniaQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}

// ==================== CARTELES ====================

export class CartelDestinationDto {
  @ApiProperty({ example: 'Pueblo Mizu' })
  @IsString()
  dest: string;

  @ApiProperty({ example: 1200 })
  @IsInt()
  dist: number;

  @ApiProperty({ example: 'N' })
  @IsString()
  @MaxLength(8)
  dir: string;
}

export class CreateCartelDto extends BaseDto {
  @ApiProperty({ example: 'Cartel km 12' })
  @IsString()
  @MaxLength(128)
  name: string;

  @ApiProperty({ example: 'Ruta 1' })
  @IsString()
  @MaxLength(64)
  highway: string;

  @ApiPropertyOptional({ type: [CartelDestinationDto] })
  @IsOptional()
  @IsArray()
  destinations?: CartelDestinationDto[];

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  createdBy: string;
}

export class UpdateCartelDto extends PartialType(
  OmitType(CreateCartelDto, ['createdBy'] as const),
) {}

export class ListCartelesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  highway?: string;
}
