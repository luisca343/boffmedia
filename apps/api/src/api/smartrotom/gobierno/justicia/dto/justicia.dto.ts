import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';
import { PagedQueryDto } from '../../_shared/dto/paged-query.dto';
import { SEVERITY_LEVELS } from '../../seguridad/dto/seguridad.dto';

// ==================== EXPEDIENTES ====================

export class CreateExpedienteDto extends BaseDto {
  @ApiProperty({ example: 'Investigación por robo reincidente' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  subjectUuid: string;

  @ApiPropertyOptional({ example: 'justicia', default: 'justicia' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  dep?: string = 'justicia';

  @ApiPropertyOptional({ enum: SEVERITY_LEVELS, default: 'medium' })
  @IsOptional()
  @IsEnum(SEVERITY_LEVELS)
  severity?: (typeof SEVERITY_LEVELS)[number] = 'medium';

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  leadUuid: string;
}

export class UpdateExpedienteDto extends PartialType(
  OmitType(CreateExpedienteDto, ['subjectUuid'] as const),
) {
  @ApiPropertyOptional({ enum: ['open', 'closed'] })
  @IsOptional()
  @IsEnum(['open', 'closed'] as const)
  status?: 'open' | 'closed';
}

export class ListExpedientesQueryDto extends PagedQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: SEVERITY_LEVELS })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dep?: string;
}

export class CreateExpedienteEventoDto extends BaseDto {
  @ApiProperty({
    example: 'nota',
    description: 'Free-form timeline entry kind',
  })
  @IsString()
  @MaxLength(16)
  kind: string;

  @ApiPropertyOptional({
    example: 'DEN-4F2A9C',
    description: 'Related code (denuncia, multa…)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  ref?: string;

  @ApiProperty({ example: 'Se cita al acusado para audiencia el viernes' })
  @IsString()
  text: string;
}

// ==================== APELACIONES ====================

export class CreateApelacionDto extends BaseDto {
  @ApiProperty({ example: 4, type: Number })
  @IsInt()
  multaId: number;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  playerUuid: string;

  @ApiProperty({ example: 'La multa se emitió sin evidencia adjunta' })
  @IsString()
  grounds: string;
}

export class UpdateApelacionDto extends BaseDto {
  @ApiPropertyOptional({ example: 'Añado captura de pantalla como prueba' })
  @IsOptional()
  @IsString()
  grounds?: string;

  @ApiPropertyOptional({
    enum: ['pending', 'reviewing'],
    description:
      'Only non-terminal transitions — use /resolve for upheld/overturned',
  })
  @IsOptional()
  @IsEnum(['pending', 'reviewing'] as const)
  status?: 'pending' | 'reviewing';
}

export class ResolveApelacionDto extends BaseDto {
  @ApiProperty({ enum: ['upheld', 'overturned'] })
  @IsEnum(['upheld', 'overturned'] as const)
  outcome: 'upheld' | 'overturned';

  @ApiProperty({
    example: 'Se confirma la multa: la evidencia aportada no la contradice',
  })
  @IsString()
  decision: string;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  reviewerUuid: string;
}

export class ListApelacionesQueryDto extends PagedQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
