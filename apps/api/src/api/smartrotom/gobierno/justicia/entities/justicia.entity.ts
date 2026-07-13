import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonRefEntity } from '../../_shared/entities/person-ref.entity';

export class GobiernoExpedienteEventoEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 3 })
  expedienteId: number;

  @ApiProperty({ example: 'nota' })
  kind: string;

  @ApiPropertyOptional({ nullable: true })
  ref?: string | null;

  @ApiProperty()
  text: string;

  @ApiProperty()
  at: Date;
}

export class GobiernoExpedienteEventoListEntity {
  @ApiProperty({ type: [GobiernoExpedienteEventoEntity] })
  items: GobiernoExpedienteEventoEntity[];

  @ApiProperty({ example: 4 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}

export class GobiernoExpedienteEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'EXP-4F2A9C' })
  code: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: PersonRefEntity })
  subject: PersonRefEntity;

  @ApiProperty({ example: 'justicia' })
  dep: string;

  @ApiProperty({ example: 'open' })
  status: string;

  @ApiProperty({ example: 'medium' })
  severity: string;

  @ApiProperty({ type: PersonRefEntity })
  lead: PersonRefEntity;

  @ApiProperty()
  openedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  closedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [GobiernoExpedienteEventoEntity] })
  timeline?: GobiernoExpedienteEventoEntity[];
}

export class GobiernoExpedienteListEntity {
  @ApiProperty({ type: [GobiernoExpedienteEntity] })
  items: GobiernoExpedienteEntity[];

  @ApiProperty({ example: 6 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}

export class GobiernoApelacionEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'APE-4F2A9C' })
  code: string;

  @ApiProperty({ example: 4 })
  multaId: number;

  @ApiProperty({ type: PersonRefEntity })
  player: PersonRefEntity;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty()
  grounds: string;

  @ApiPropertyOptional({ type: PersonRefEntity, nullable: true })
  reviewer?: PersonRefEntity | null;

  @ApiPropertyOptional({ nullable: true })
  decision?: string | null;

  @ApiPropertyOptional({ nullable: true })
  resolvedAt?: Date | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  refundTxId?: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GobiernoApelacionListEntity {
  @ApiProperty({ type: [GobiernoApelacionEntity] })
  items: GobiernoApelacionEntity[];

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}
