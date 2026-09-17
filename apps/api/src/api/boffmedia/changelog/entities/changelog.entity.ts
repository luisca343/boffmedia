import { ApiProperty } from '@nestjs/swagger';

export class ChangelogCtaEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ['boffmedia', 'smartrotom', 'all'] })
  product: string;

  @ApiProperty({ enum: ['all', 'web', 'desktop'] })
  platform: string;

  @ApiProperty()
  url: string;
}

export class ChangelogTranslationEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ['es', 'en'] })
  locale: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true, type: String })
  summary: string | null;

  @ApiProperty()
  body: string;

  @ApiProperty({ nullable: true, type: String })
  ctaLabel: string | null;
}

export class ChangelogItemEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ['boffmedia', 'smartrotom', 'all'] })
  product: string;

  @ApiProperty({ enum: ['all', 'web', 'desktop'] })
  platform: string;

  @ApiProperty({ nullable: true, type: String })
  version: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  publishedAt: string;

  @ApiProperty({ type: ChangelogTranslationEntity })
  translation: ChangelogTranslationEntity;

  @ApiProperty({ nullable: true, type: ChangelogCtaEntity })
  cta: ChangelogCtaEntity | null;
}

export class ChangelogListEntity {
  @ApiProperty({ type: [ChangelogItemEntity] })
  items: ChangelogItemEntity[];

  @ApiProperty()
  hasUnread: boolean;

  @ApiProperty()
  unreadCount: number;
}

export class ChangelogAdminTranslationEntity extends ChangelogTranslationEntity {
  @ApiProperty({ enum: ['draft', 'translated', 'reviewed'] })
  status: string;
}

export class ChangelogAdminItemEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ['boffmedia', 'smartrotom', 'all'] })
  product: string;

  @ApiProperty({ enum: ['all', 'web', 'desktop'] })
  platform: string;

  @ApiProperty({ nullable: true, type: String })
  version: string | null;

  @ApiProperty({ enum: ['draft', 'published', 'unpublished'] })
  status: string;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  publishedAt: string | null;

  @ApiProperty({ type: [ChangelogAdminTranslationEntity] })
  translations: ChangelogAdminTranslationEntity[];

  @ApiProperty({ type: [ChangelogCtaEntity] })
  ctas: ChangelogCtaEntity[];

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;
}

export class ChangelogSeenEntity {
  @ApiProperty()
  success: boolean;
}
