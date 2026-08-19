import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';

// Every SmartRotom @Body DTO must extend BaseDto: MinecraftMiddleware requires a
// `server` field on non-GET requests, and ValidationPipe's forbidNonWhitelisted
// would otherwise reject it with "property server should not exist".
export class UpsertPcMarkDto extends BaseDto {
  @ApiProperty({
    description: 'Opaque content hash identifying the Pokémon',
    example: '25|0|adamant|static|31,31,31,31,31,31',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  pokemonKey: string;

  @ApiProperty({
    description: 'Favourite flag. Omit to leave unchanged.',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  favorite?: boolean;

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Full replacement tag list. Omit to leave unchanged.',
    required: false,
    example: ['competitivo'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(32, { each: true })
  @ArrayMaxSize(32)
  tags?: string[];
}

export class BulkUpsertPcMarksDto extends BaseDto {
  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Opaque content hashes of the Pokémon to mark',
    example: ['25|0|adamant|static|31,31,31,31,31,31'],
  })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  @ArrayMaxSize(500)
  pokemonKeys: string[];

  @ApiProperty({
    description:
      'Favourite flag applied to every key. Omit to leave unchanged.',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  favorite?: boolean;

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Tags to add to every key',
    required: false,
    example: ['competitivo'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(32, { each: true })
  @ArrayMaxSize(32)
  addTags?: string[];

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Tags to remove from every key',
    required: false,
    example: ['por-revisar'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(32, { each: true })
  @ArrayMaxSize(32)
  removeTags?: string[];
}
