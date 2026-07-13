import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonRefEntity } from '../../_shared/entities/person-ref.entity';
import { EventoWeightsDto } from '../dto/eventos.dto';

export class GobiernoEventoEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'EVT-4F2A9C' })
  code: string;

  @ApiProperty({ enum: ['construccion', 'caza'] })
  type: string;

  @ApiProperty({ example: 'upcoming' })
  status: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  brief?: string | null;

  @ApiPropertyOptional({ nullable: true })
  prize?: string | null;

  @ApiPropertyOptional({ nullable: true })
  crew?: string | null;

  @ApiPropertyOptional({ nullable: true })
  buildClosedAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  ratingOpensAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  ratingClosesAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  winnerTown?: string | null;

  @ApiPropertyOptional({ nullable: true })
  zone?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  coordsX?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  coordsZ?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  radius?: number | null;

  @ApiPropertyOptional({ nullable: true })
  opensAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  closesAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  rules?: string | null;

  @ApiPropertyOptional({ type: EventoWeightsDto, nullable: true })
  weights?: EventoWeightsDto | null;

  @ApiProperty({ type: PersonRefEntity })
  createdBy: PersonRefEntity;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GobiernoEventoObraEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 3 })
  eventoId: number;

  @ApiProperty({ example: 'pueblo_mizu' })
  town: string;

  @ApiProperty({ example: 'El Faro de Cristal' })
  buildName: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty({ type: [PersonRefEntity] })
  builders: PersonRefEntity[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({
    example: 8.4,
    description: 'Average diseño (0-10), derived from votos',
  })
  diseno: number;

  @ApiProperty({
    example: 7.1,
    description: 'Average ambición (0-10), derived from votos',
  })
  ambicion: number;

  @ApiProperty({
    example: 9.0,
    description: 'Average fidelidad (0-10), derived from votos',
  })
  fidelidad: number;

  @ApiProperty({ example: 24, description: 'Number of votes cast' })
  votes: number;
}

export class GobiernoEventoObraListEntity {
  @ApiProperty({ type: [GobiernoEventoObraEntity] })
  items: GobiernoEventoObraEntity[];

  @ApiProperty({ example: 5 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}

export class GobiernoEventoEspecieEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 3 })
  eventoId: number;

  @ApiProperty({ example: 'Charizard' })
  name: string;

  @ApiProperty({ example: 'legendaria' })
  rarity: string;

  @ApiProperty({ example: 50 })
  rarityPts: number;

  @ApiProperty({ example: 2.5 })
  spawnPct: number;

  @ApiProperty({ example: 0.5 })
  shinyPct: number;

  @ApiProperty({ example: 20 })
  lvlMin: number;

  @ApiProperty({ example: 45 })
  lvlMax: number;
}

export class GobiernoEventoEspecieListEntity {
  @ApiProperty({ type: [GobiernoEventoEspecieEntity] })
  items: GobiernoEventoEspecieEntity[];

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}

export class GobiernoEventoCapturaEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 3 })
  eventoId: number;

  @ApiProperty({ type: PersonRefEntity })
  player: PersonRefEntity;

  @ApiProperty({ example: 'Charizard' })
  species: string;

  @ApiProperty({ example: 42 })
  level: number;

  @ApiProperty({ example: 155 })
  ivsTotal: number;

  @ApiProperty({ example: false })
  shiny: boolean;

  @ApiPropertyOptional({ type: Number, nullable: true })
  size?: number | null;

  @ApiProperty({ example: 320 })
  score: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GobiernoEventoCapturasResponseEntity {
  @ApiProperty({
    example: true,
    description: 'true while the hunt is live — individual rows are withheld',
  })
  blind: boolean;

  @ApiPropertyOptional({ example: 18, description: 'Present while blind' })
  participants?: number;

  @ApiPropertyOptional({ example: 18, description: 'Present while blind' })
  capturasRegistradas?: number;

  @ApiPropertyOptional({
    type: [GobiernoEventoCapturaEntity],
    description: 'Present once closed',
  })
  items?: GobiernoEventoCapturaEntity[];

  @ApiPropertyOptional({ example: 18 })
  total?: number;

  @ApiPropertyOptional({ example: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  pageSize?: number;
}
