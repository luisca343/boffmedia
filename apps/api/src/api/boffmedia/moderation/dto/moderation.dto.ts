import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  REPORT_REASON,
  REPORT_STATUS,
  ReportReason,
  ReportStatus,
  SANCTION_KIND,
  SanctionKind,
} from '@/_db/schema/BoffMediaModeration';
import { REPORTABLE_CONTENT_TYPES } from '../content-registry';

const REASONS = Object.values(REPORT_REASON);
const STATUSES = Object.values(REPORT_STATUS);
const KINDS = Object.values(SANCTION_KIND);

/**
 * Reporting a piece of content. `contentType` + `contentId` is the whole
 * addressing scheme — the caller never names a table, and the server never
 * needs a per-surface endpoint.
 *
 * `@IsIn(REPORTABLE_CONTENT_TYPES)` is what keeps the varchar column honest:
 * the registry is the closed set, and it is enforced here, at the edge.
 */
export class CreateContentReportDto {
  @ApiProperty({ enum: REPORTABLE_CONTENT_TYPES, example: 'forum_post' })
  @IsIn(REPORTABLE_CONTENT_TYPES as unknown as string[])
  contentType!: string;

  @ApiProperty({ example: '412', description: 'The item id, as a string.' })
  @IsString()
  @MaxLength(64)
  contentId!: string;

  @ApiProperty({ enum: REASONS, example: REPORT_REASON.SPAM })
  @IsEnum(REPORT_REASON)
  reason!: ReportReason;

  @ApiPropertyOptional({
    example: 'Enlaces de afiliados repetidos en todo el hilo.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  detail?: string;
}

export class ModerationQueueQueryDto {
  @ApiPropertyOptional({ enum: STATUSES, default: REPORT_STATUS.OPEN })
  @IsOptional()
  @IsEnum(REPORT_STATUS)
  status?: ReportStatus;

  @ApiPropertyOptional({ enum: REPORTABLE_CONTENT_TYPES })
  @IsOptional()
  @IsIn(REPORTABLE_CONTENT_TYPES as unknown as string[])
  contentType?: string;

  /**
   * `reports` puts the most-reported item first, which is the point of the
   * queue: a plain chronological list surfaces the oldest complaint rather than
   * the worst one, and the worst one is what is still hurting people.
   */
  @ApiPropertyOptional({
    enum: ['reports', 'oldest', 'newest'],
    default: 'reports',
  })
  @IsOptional()
  @IsIn(['reports', 'oldest', 'newest'])
  sort?: 'reports' | 'oldest' | 'newest';

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

/** Every admin decision carries a reason — it is what the audit row is for. */
export class ModerationDecisionDto {
  @ApiProperty({ example: 'Reporte duplicado, el hilo ya estaba moderado.' })
  @IsString()
  @MaxLength(200)
  reason!: string;
}

export class CreateSanctionDto {
  @ApiProperty({ enum: REPORTABLE_CONTENT_TYPES, example: 'forum_post' })
  @IsIn(REPORTABLE_CONTENT_TYPES as unknown as string[])
  contentType!: string;

  @ApiProperty({ example: '412' })
  @IsString()
  @MaxLength(64)
  contentId!: string;

  @ApiProperty({ enum: KINDS, example: SANCTION_KIND.WARNING })
  @IsEnum(SANCTION_KIND)
  kind!: SanctionKind;

  @ApiProperty({ example: 'Spam reiterado tras un aviso previo.' })
  @IsString()
  @MaxLength(200)
  reason!: string;

  /**
   * Days a content ban lasts. Omitted means indefinite — deliberately not a
   * default of "forever" hidden behind a missing field in the UI, which is why
   * the web form asks for it explicitly.
   */
  @ApiPropertyOptional({ example: 7, minimum: 1, maximum: 3650 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  days?: number;
}
