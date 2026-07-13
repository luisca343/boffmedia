import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonRefEntity } from '../../_shared/entities/person-ref.entity';
import { CartelDestinationDto } from '../dto/administracion.dto';

export class GobiernoNpcSkinEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'oficial_teras' })
  skin: string;

  @ApiPropertyOptional({ type: [String], nullable: true })
  npcs?: string[] | null;

  @ApiProperty({ example: 0 })
  src: number;

  @ApiProperty({ example: 0 })
  face: number;

  @ApiProperty({ example: 0 })
  head: number;

  @ApiProperty({ example: 0 })
  body: number;

  @ApiProperty()
  updatedAt: Date;
}

export class GobiernoMegafoniaEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Alcaldía de Teras' })
  speaker: string;

  @ApiProperty()
  text: string;

  @ApiProperty({ type: PersonRefEntity })
  by: PersonRefEntity;

  @ApiProperty()
  createdAt: Date;
}

export class GobiernoCartelEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Cartel km 12' })
  name: string;

  @ApiProperty({ example: 'Ruta 1' })
  highway: string;

  @ApiPropertyOptional({ type: [CartelDestinationDto], nullable: true })
  destinations?: CartelDestinationDto[] | null;

  @ApiProperty({ type: PersonRefEntity })
  createdBy: PersonRefEntity;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
