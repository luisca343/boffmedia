import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';
import { PagedQueryDto } from '../../_shared/dto/paged-query.dto';

export class CreateAnuncioDto extends BaseDto {
  @ApiPropertyOptional({ example: 'anuncio', default: 'anuncio' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  kind?: string = 'anuncio';

  @ApiProperty({ example: 'Nuevo horario de la Torre de Combate' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'A partir del lunes, la Torre abrirá de 18:00 a 00:00.',
  })
  @IsString()
  body: string;

  @ApiPropertyOptional({ example: 'pueblo_mizu' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  town?: string;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  authorUuid: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean = false;

  @ApiPropertyOptional({ example: 'public', default: 'public' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  audience?: string = 'public';
}

export class UpdateAnuncioDto extends PartialType(
  OmitType(CreateAnuncioDto, ['authorUuid'] as const),
) {}

export class ListAnunciosQueryDto extends PagedQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  kind?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  town?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audience?: string;

  @ApiPropertyOptional({ description: 'Filter by pinned/unpinned' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pinned?: boolean;
}
