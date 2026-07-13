import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseDto } from '@api/_utils/dto/base.dto';
import { PagedQueryDto } from '../../_shared/dto/paged-query.dto';

export class CreateZonaDto extends BaseDto {
  @ApiProperty({ example: 'pueblo_mizu' })
  @IsString()
  @MaxLength(64)
  town: string;

  @ApiProperty({ example: 'Distrito Comercial' })
  @IsString()
  @MaxLength(128)
  name: string;

  @ApiProperty({ example: 'comercial', description: 'Free-form zone kind' })
  @IsString()
  @MaxLength(32)
  kind: string;

  @ApiPropertyOptional({ example: 'Zona destinada a tiendas y NPCs mercantes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description:
      'Officer performing the action, for the audit log (zonas has no owner column)',
  })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

export class UpdateZonaDto extends PartialType(CreateZonaDto) {}

// Zonas is a small, admin-configured table — the frontend reads it as a bare array, no
// pagination envelope.
export class ListZonasQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  town?: string;
}

export class CreateParcelaDto extends BaseDto {
  @ApiProperty({
    example: 'pueblo_mizu__parcela_1',
    description: 'The exact WorldGuard region id',
  })
  @IsString()
  @MaxLength(128)
  regionId: string;

  @ApiProperty({ example: 'pueblo_mizu' })
  @IsString()
  @MaxLength(64)
  town: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  number: number;

  @ApiPropertyOptional({ example: 3, type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  zonaId?: number | null;

  @ApiPropertyOptional({ example: 'ocupada', default: 'ocupada' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  status?: string = 'ocupada';

  @ApiPropertyOptional({ example: 500, default: 500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  taxAmount?: number = 500;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  taxDueAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Officer performing the action, for the audit log',
  })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}

export class UpdateParcelaDto extends PartialType(
  OmitType(CreateParcelaDto, ['regionId', 'town', 'number'] as const),
) {}

export class ListParcelasQueryDto extends PagedQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  town?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  zonaId?: number;
}

export class CreateParcelaHistorialDto extends BaseDto {
  @ApiProperty({ example: 'pueblo_mizu' })
  @IsString()
  @MaxLength(64)
  town: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  number: number;

  @ApiPropertyOptional({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsOptional()
  @IsUUID()
  previousOwnerUuid?: string;

  @ApiPropertyOptional({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsOptional()
  @IsUUID()
  newOwnerUuid?: string;

  @ApiPropertyOptional({ example: 'Traspaso por compraventa' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class ListAllHistorialQueryDto extends PagedQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  town?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  regionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class CreateSubastaDto extends BaseDto {
  @ApiProperty({ example: 'pueblo_mizu__parcela_1' })
  @IsString()
  @MaxLength(128)
  regionId: string;

  @ApiProperty({ example: 'pueblo_mizu' })
  @IsString()
  @MaxLength(64)
  town: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  number: number;

  @ApiProperty({ example: 5000 })
  @IsInt()
  @Min(1)
  startBid: number;

  @ApiPropertyOptional({ example: 'Parcela requisada por impago de impuestos' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  endsAt: string;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  createdBy: string;
}

export class UpdateSubastaDto extends PartialType(
  OmitType(CreateSubastaDto, [
    'regionId',
    'town',
    'number',
    'createdBy',
  ] as const),
) {
  @ApiPropertyOptional({
    enum: ['live', 'closed', 'cancelled'],
    description:
      'Manual status override — prefer POST :id/close to settle a live auction',
  })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  status?: string;
}

export class ListSubastasQueryDto extends PagedQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  town?: string;
}

export class PlaceBidDto extends BaseDto {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  uuid: string;

  @ApiProperty({ example: 5500 })
  @IsInt()
  @Min(1)
  amount: number;
}

export class CloseSubastaDto extends BaseDto {
  @ApiPropertyOptional({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Officer closing the auction, for the audit log',
  })
  @IsOptional()
  @IsUUID()
  actorUuid?: string;
}
