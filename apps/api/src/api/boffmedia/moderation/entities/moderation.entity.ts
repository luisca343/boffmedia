import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * What the reporter gets back. Thin on purpose: the reporter must not learn
 * anything about the moderation decision from the act of reporting, or a
 * report becomes a probe. `duplicate` is the one thing they may know, because
 * it is about their own earlier action.
 */
export class ReportAcknowledgementEntity {
  @ApiProperty({ example: true })
  received!: boolean;

  @ApiProperty({
    example: false,
    description: 'True when this updated the reporter’s existing report.',
  })
  duplicate!: boolean;
}

export class AuthorSummaryEntity {
  @ApiPropertyOptional({ example: 42 })
  userId?: number | null;

  @ApiPropertyOptional({ example: 'f4c0d1a2-0000-4000-8000-000000000000' })
  uuid?: string | null;

  @ApiPropertyOptional({ example: 'kirbo' })
  username?: string | null;

  @ApiProperty({ example: 3, description: 'Open reports against this author.' })
  openReports!: number;

  @ApiProperty({
    example: 1,
    description: 'Reports against this author that ended in an action.',
  })
  actionedReports!: number;

  @ApiProperty({
    example: 7,
    description: 'Reports against this author, ever.',
  })
  totalReports!: number;

  @ApiProperty({ example: 0, description: 'Sanctions on record.' })
  sanctions!: number;

  @ApiProperty({ example: false })
  contentBanned!: boolean;
}

export class ReporterEntity {
  @ApiProperty({ example: 12 })
  userId!: number;

  @ApiPropertyOptional({ example: 'nia' })
  username?: string | null;

  @ApiProperty({ example: 'spam' })
  reason!: string;

  @ApiPropertyOptional({ example: 'Tercera vez esta semana.' })
  detail?: string | null;

  @ApiProperty({ example: '2026-09-04T10:00:00.000Z' })
  createdAt!: string;
}

export class ModerationQueueItemEntity {
  @ApiProperty({ example: 'forum_post' })
  contentType!: string;

  @ApiProperty({ example: '412' })
  contentId!: string;

  @ApiProperty({ example: 4 })
  reportCount!: number;

  @ApiProperty({ example: ['spam', 'harassment'], type: [String] })
  reasons!: string[];

  @ApiProperty({ example: '2026-09-03T08:12:00.000Z' })
  firstReportedAt!: string;

  @ApiProperty({ example: '2026-09-04T09:40:00.000Z' })
  lastReportedAt!: string;

  /**
   * The content itself, flattened to plain text. The queue shows text, never
   * markup: the stored HTML is sanitised on write, but re-rendering it inside
   * the admin console would put author-controlled markup in the one session
   * that can ban people.
   */
  @ApiPropertyOptional({ example: 'Compra seguidores baratos en…' })
  excerpt?: string | null;

  @ApiProperty({
    example: false,
    description: 'True when the item is gone from the surface it lives on.',
  })
  hidden!: boolean;

  @ApiProperty({
    example: true,
    description: 'False when the content no longer exists at all.',
  })
  contentExists!: boolean;

  @ApiPropertyOptional({ example: '2026-09-01T12:00:00.000Z' })
  contentCreatedAt?: string | null;

  @ApiProperty({ type: AuthorSummaryEntity })
  author!: AuthorSummaryEntity;
}

export class ModerationQueuePageEntity {
  @ApiProperty({ type: ModerationQueueItemEntity, isArray: true })
  items!: ModerationQueueItemEntity[];

  @ApiProperty({ example: 37 })
  total!: number;

  @ApiPropertyOptional({ example: 20 })
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  offset?: number;
}

export class ModerationSanctionEntity {
  @ApiProperty({ example: 5 })
  id!: number;

  @ApiProperty({ example: 'content_ban' })
  kind!: string;

  @ApiProperty({ example: 'Spam reiterado.' })
  reason!: string;

  @ApiPropertyOptional({ example: '2026-09-11T00:00:00.000Z' })
  expiresAt?: string | null;

  @ApiPropertyOptional({ example: null })
  revokedAt?: string | null;

  @ApiProperty({ example: '2026-09-04T09:00:00.000Z' })
  createdAt!: string;
}

export class ModerationItemDetailEntity extends ModerationQueueItemEntity {
  @ApiProperty({ type: ReporterEntity, isArray: true })
  reporters!: ReporterEntity[];

  @ApiProperty({ type: ModerationSanctionEntity, isArray: true })
  authorSanctions!: ModerationSanctionEntity[];
}
