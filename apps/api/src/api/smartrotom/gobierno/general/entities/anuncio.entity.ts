import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonRefEntity } from '../../_shared/entities/person-ref.entity';

export class GobiernoAnuncioEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'anuncio' })
  kind: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiPropertyOptional({ nullable: true })
  town?: string | null;

  @ApiProperty({ type: PersonRefEntity })
  author: PersonRefEntity;

  @ApiProperty({ example: false })
  pinned: boolean;

  @ApiProperty({ example: 'public' })
  audience: string;

  @ApiProperty()
  publishedAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GobiernoAnuncioListEntity {
  @ApiProperty({ type: [GobiernoAnuncioEntity] })
  items: GobiernoAnuncioEntity[];

  @ApiProperty({ example: 6 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}
