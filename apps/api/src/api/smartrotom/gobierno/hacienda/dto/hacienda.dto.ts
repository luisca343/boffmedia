import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';
import { PagedQueryDto } from '../../_shared/dto/paged-query.dto';

// ==================== MULTAS ====================

export class CreateMultaDto extends BaseDto {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  playerUuid: string;

  @ApiProperty({ example: 500 })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Vandalismo en zona pública' })
  @IsString()
  @MaxLength(255)
  reason: string;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  issuedBy: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Related denuncia, if any',
  })
  @IsOptional()
  @IsInt()
  denunciaId?: number;
}

export class UpdateMultaDto extends PartialType(
  OmitType(CreateMultaDto, ['playerUuid', 'issuedBy'] as const),
) {}

export class PayMultaDto extends BaseDto {}

export class CancelMultaDto extends BaseDto {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  actorUuid: string;

  @ApiPropertyOptional({ example: 'Multa anulada por error administrativo' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ListMultasQueryDto extends PagedQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by fined player uuid' })
  @IsOptional()
  @IsUUID()
  player?: string;
}

// ==================== TASAS ====================

export class CreateTasaDto extends BaseDto {
  @ApiProperty({ example: 'Impuesto de parcela' })
  @IsString()
  @MaxLength(128)
  concept: string;

  @ApiProperty({ example: 'parcela', description: 'Free-form rate-card kind' })
  @IsString()
  @MaxLength(32)
  kind: string;

  @ApiProperty({ example: '500₽/parcela', description: 'Human-readable rate' })
  @IsString()
  @MaxLength(64)
  rate: string;

  @ApiPropertyOptional({ example: 500, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number = 0;

  @ApiPropertyOptional({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Officer performing the action, for the audit log',
  })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

export class UpdateTasaDto extends PartialType(CreateTasaDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ListTasasQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  kind?: string;

  @ApiPropertyOptional({ description: 'Filter by active/inactive' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  active?: boolean;
}

export class GetTesoreriaQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 365, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;
}
