import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonRefEntity } from '../../_shared/entities/person-ref.entity';

export class GobiernoDenunciaEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'DEN-4F2A9C' })
  code: string;

  @ApiPropertyOptional({ nullable: true })
  town?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  plotNumber?: number | null;

  @ApiPropertyOptional({ type: PersonRefEntity, nullable: true })
  accused?: PersonRefEntity | null;

  @ApiProperty({ type: PersonRefEntity })
  reporter: PersonRefEntity;

  @ApiProperty({ example: 'ruido' })
  category: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional({ nullable: true })
  resolution?: string | null;

  @ApiPropertyOptional({ type: PersonRefEntity, nullable: true })
  resolvedBy?: PersonRefEntity | null;

  @ApiPropertyOptional({ nullable: true })
  resolvedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GobiernoDenunciaListEntity {
  @ApiProperty({ type: [GobiernoDenunciaEntity] })
  items: GobiernoDenunciaEntity[];

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}

export class GobiernoBuscadoEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'BUS-4F2A9C' })
  code: string;

  @ApiProperty({ type: PersonRefEntity })
  player: PersonRefEntity;

  @ApiProperty({ example: 'high', enum: ['low', 'medium', 'high', 'critical'] })
  severity: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 500 })
  bounty: number;

  @ApiProperty()
  offense: string;

  @ApiProperty({ type: PersonRefEntity })
  reportedBy: PersonRefEntity;

  @ApiPropertyOptional({ nullable: true })
  lastSeen?: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;

  @ApiPropertyOptional({ type: PersonRefEntity, nullable: true })
  capturedBy?: PersonRefEntity | null;

  @ApiPropertyOptional({ nullable: true })
  capturedAt?: Date | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  payoutTxId?: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GobiernoBuscadoListEntity {
  @ApiProperty({ type: [GobiernoBuscadoEntity] })
  items: GobiernoBuscadoEntity[];

  @ApiProperty({ example: 5 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}

export class GobiernoPatrullaEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ronda nocturna — Mizu' })
  label: string;

  @ApiProperty({ example: '22:00' })
  fromTime: string;

  @ApiProperty({ example: '06:00' })
  toTime: string;

  @ApiPropertyOptional({ nullable: true })
  zone?: string | null;

  @ApiProperty({ example: 'rest' })
  status: string;

  @ApiProperty({ type: [PersonRefEntity] })
  officers: PersonRefEntity[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GobiernoBitacoraEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  patrullaId?: number | null;

  @ApiProperty({ type: PersonRefEntity })
  officer: PersonRefEntity;

  @ApiProperty()
  text: string;

  @ApiProperty({ example: 'info', enum: ['ok', 'warn', 'danger', 'info'] })
  tone: string;

  @ApiProperty()
  createdAt: Date;
}
