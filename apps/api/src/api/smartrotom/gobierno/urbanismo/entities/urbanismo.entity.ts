import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonRefEntity } from '../../_shared/entities/person-ref.entity';

export class GobiernoZonaEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'pueblo_mizu' })
  town: string;

  @ApiProperty({ example: 'Distrito Comercial' })
  name: string;

  @ApiProperty({ example: 'comercial' })
  kind: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GobiernoParcelaEntity {
  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Null when this plot has no gobierno metadata row yet',
  })
  id?: number | null;

  @ApiProperty({ example: 'pueblo_mizu__parcela_1' })
  regionId: string;

  @ApiProperty({ example: 'pueblo_mizu' })
  town: string;

  @ApiProperty({ example: 1 })
  number: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  zonaId?: number | null;

  @ApiProperty({ example: 'sin_registrar' })
  status: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  taxAmount?: number | null;

  @ApiPropertyOptional({ nullable: true })
  taxDueAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;

  @ApiPropertyOptional({ type: PersonRefEntity, nullable: true })
  owner?: PersonRefEntity | null;

  @ApiPropertyOptional({ nullable: true })
  createdAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  updatedAt?: Date | null;
}

export class GobiernoParcelaListEntity {
  @ApiProperty({ type: [GobiernoParcelaEntity] })
  items: GobiernoParcelaEntity[];

  @ApiProperty({ example: 340 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}

export class GobiernoParcelaHistorialEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'pueblo_mizu__parcela_1' })
  regionId: string;

  @ApiProperty({ example: 'pueblo_mizu' })
  town: string;

  @ApiProperty({ example: 1 })
  number: number;

  @ApiPropertyOptional({ type: PersonRefEntity, nullable: true })
  previousOwner?: PersonRefEntity | null;

  @ApiPropertyOptional({ type: PersonRefEntity, nullable: true })
  newOwner?: PersonRefEntity | null;

  @ApiPropertyOptional({ nullable: true })
  reason?: string | null;

  @ApiProperty()
  changedAt: Date;
}

export class GobiernoParcelaHistorialListEntity {
  @ApiProperty({ type: [GobiernoParcelaHistorialEntity] })
  items: GobiernoParcelaHistorialEntity[];

  @ApiProperty({ example: 5 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}

export class GobiernoPujaEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ type: PersonRefEntity })
  bidder: PersonRefEntity;

  @ApiProperty({ example: 5500 })
  amount: number;

  @ApiProperty()
  createdAt: Date;
}

export class GobiernoSubastaEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'SUB-4F2A9C' })
  code: string;

  @ApiProperty({ example: 'pueblo_mizu__parcela_1' })
  regionId: string;

  @ApiProperty({ example: 'pueblo_mizu' })
  town: string;

  @ApiProperty({ example: 1 })
  number: number;

  @ApiProperty({ example: 5000 })
  startBid: number;

  @ApiProperty({ example: 5500 })
  currentBid: number;

  @ApiPropertyOptional({ type: PersonRefEntity, nullable: true })
  bidder?: PersonRefEntity | null;

  @ApiProperty({ example: 3 })
  bids: number;

  @ApiPropertyOptional({ nullable: true })
  reason?: string | null;

  @ApiProperty({ example: 'live' })
  status: string;

  @ApiProperty()
  endsAt: Date;

  @ApiPropertyOptional({ type: Number, nullable: true })
  settledTxId?: number | null;

  @ApiProperty({ type: PersonRefEntity })
  createdBy: PersonRefEntity;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({
    type: [GobiernoPujaEntity],
    description: 'Most recent bids for this auction (last 20)',
  })
  recentBids?: GobiernoPujaEntity[];
}

export class GobiernoSubastaListEntity {
  @ApiProperty({ type: [GobiernoSubastaEntity] })
  items: GobiernoSubastaEntity[];

  @ApiProperty({ example: 8 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}
