import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  CHANGELOG_LOCALE,
  CHANGELOG_PLATFORM,
  CHANGELOG_PRODUCT,
  CHANGELOG_STATUS,
  CHANGELOG_TRANSLATION_STATUS,
} from '@/_db/schema/BoffMediaChangelog';

const PRODUCTS = [
  CHANGELOG_PRODUCT.BOFFMEDIA,
  CHANGELOG_PRODUCT.SMARTROTOM,
  CHANGELOG_PRODUCT.ALL,
] as const;
const PUBLIC_PRODUCTS = [
  CHANGELOG_PRODUCT.BOFFMEDIA,
  CHANGELOG_PRODUCT.SMARTROTOM,
] as const;
const PLATFORMS = [
  CHANGELOG_PLATFORM.ALL,
  CHANGELOG_PLATFORM.WEB,
  CHANGELOG_PLATFORM.DESKTOP,
] as const;
const LOCALES = [CHANGELOG_LOCALE.ES, CHANGELOG_LOCALE.EN] as const;
const TRANSLATION_STATUSES = [
  CHANGELOG_TRANSLATION_STATUS.DRAFT,
  CHANGELOG_TRANSLATION_STATUS.TRANSLATED,
  CHANGELOG_TRANSLATION_STATUS.REVIEWED,
] as const;

export class ChangelogListQueryDto {
  @ApiPropertyOptional({
    enum: [CHANGELOG_PRODUCT.BOFFMEDIA, CHANGELOG_PRODUCT.SMARTROTOM],
    default: CHANGELOG_PRODUCT.BOFFMEDIA,
  })
  @IsOptional()
  @IsIn(PUBLIC_PRODUCTS)
  product?: (typeof PUBLIC_PRODUCTS)[number];

  @ApiPropertyOptional({ enum: PLATFORMS, default: CHANGELOG_PLATFORM.WEB })
  @IsOptional()
  @IsIn(PLATFORMS)
  platform?: (typeof PLATFORMS)[number];

  @ApiPropertyOptional({ enum: LOCALES, default: CHANGELOG_LOCALE.ES })
  @IsOptional()
  @IsIn(LOCALES)
  locale?: (typeof LOCALES)[number];

  @ApiPropertyOptional({ example: 50, default: 50, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class ChangelogTranslationInputDto {
  @ApiProperty({ enum: LOCALES, example: CHANGELOG_LOCALE.ES })
  @IsIn(LOCALES)
  locale: (typeof LOCALES)[number];

  @ApiProperty({ example: 'Nuevo panel de analítica' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Consulta tus métricas en un solo lugar.' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ example: '## Qué hay de nuevo\n\nAhora puedes consultar...' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ example: 'Ver el panel' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ctaLabel?: string;

  @ApiPropertyOptional({ enum: TRANSLATION_STATUSES, default: 'draft' })
  @IsOptional()
  @IsIn(TRANSLATION_STATUSES)
  status?: (typeof TRANSLATION_STATUSES)[number];
}

export class ChangelogCtaInputDto {
  @ApiProperty({ enum: PRODUCTS, example: CHANGELOG_PRODUCT.BOFFMEDIA })
  @IsEnum(CHANGELOG_PRODUCT)
  product: (typeof PRODUCTS)[number];

  @ApiProperty({ enum: PLATFORMS, example: CHANGELOG_PLATFORM.WEB })
  @IsEnum(CHANGELOG_PLATFORM)
  platform: (typeof PLATFORMS)[number];

  @ApiProperty({ example: '/herramientas/analitica' })
  @IsString()
  @MaxLength(512)
  url: string;
}

export class CreateChangelogDto {
  @ApiProperty({ enum: PRODUCTS, example: CHANGELOG_PRODUCT.BOFFMEDIA })
  @IsEnum(CHANGELOG_PRODUCT)
  product: (typeof PRODUCTS)[number];

  @ApiProperty({ enum: PLATFORMS, example: CHANGELOG_PLATFORM.WEB })
  @IsEnum(CHANGELOG_PLATFORM)
  platform: (typeof PLATFORMS)[number];

  @ApiPropertyOptional({ type: String, example: '0.10.0' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  version?: string;

  @ApiProperty({ type: [ChangelogTranslationInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChangelogTranslationInputDto)
  translations: ChangelogTranslationInputDto[];

  @ApiPropertyOptional({ type: [ChangelogCtaInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChangelogCtaInputDto)
  ctas?: ChangelogCtaInputDto[];
}

/** Explicit rather than PartialType so the generated shared model preserves the fields. */
export class UpdateChangelogDto {
  @ApiPropertyOptional({ enum: PRODUCTS })
  @IsOptional()
  @IsEnum(CHANGELOG_PRODUCT)
  product?: (typeof PRODUCTS)[number];

  @ApiPropertyOptional({ enum: PLATFORMS })
  @IsOptional()
  @IsEnum(CHANGELOG_PLATFORM)
  platform?: (typeof PLATFORMS)[number];

  @ApiPropertyOptional({ type: String, example: '0.10.0' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  version?: string;

  @ApiPropertyOptional({ type: [ChangelogTranslationInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChangelogTranslationInputDto)
  translations?: ChangelogTranslationInputDto[];

  @ApiPropertyOptional({ type: [ChangelogCtaInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChangelogCtaInputDto)
  ctas?: ChangelogCtaInputDto[];
}

export class MarkChangelogSeenDto {
  @ApiProperty({ example: 42 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  entryId: number;

  @ApiProperty({
    enum: [CHANGELOG_PRODUCT.BOFFMEDIA, CHANGELOG_PRODUCT.SMARTROTOM],
    example: CHANGELOG_PRODUCT.BOFFMEDIA,
  })
  @IsIn(PUBLIC_PRODUCTS)
  product: (typeof PUBLIC_PRODUCTS)[number];

  @ApiProperty({ enum: PLATFORMS, example: CHANGELOG_PLATFORM.WEB })
  @IsIn(PLATFORMS)
  platform: (typeof PLATFORMS)[number];
}

export class AdminChangelogListQueryDto {
  @ApiPropertyOptional({ enum: PRODUCTS })
  @IsOptional()
  @IsIn(PRODUCTS)
  product?: (typeof PRODUCTS)[number];

  @ApiPropertyOptional({ enum: PLATFORMS })
  @IsOptional()
  @IsIn(PLATFORMS)
  platform?: (typeof PLATFORMS)[number];

  @ApiPropertyOptional({
    enum: [
      CHANGELOG_STATUS.DRAFT,
      CHANGELOG_STATUS.PUBLISHED,
      CHANGELOG_STATUS.UNPUBLISHED,
    ],
  })
  @IsOptional()
  @IsIn([
    CHANGELOG_STATUS.DRAFT,
    CHANGELOG_STATUS.PUBLISHED,
    CHANGELOG_STATUS.UNPUBLISHED,
  ])
  status?:
    | typeof CHANGELOG_STATUS.DRAFT
    | typeof CHANGELOG_STATUS.PUBLISHED
    | typeof CHANGELOG_STATUS.UNPUBLISHED;
}

export type ChangelogQuery = {
  product: (typeof PUBLIC_PRODUCTS)[number];
  platform: (typeof PLATFORMS)[number];
  locale: string;
  limit: number;
};
