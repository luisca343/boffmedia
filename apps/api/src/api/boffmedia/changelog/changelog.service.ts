import { Injectable } from '@nestjs/common';
import { ApiErrorCode } from '@/common/errors/error-codes.generated';
import { NotFoundError, ValidationError } from '@/common/errors/domain-error';
import {
  CHANGELOG_LOCALE,
  CHANGELOG_PLATFORM,
  CHANGELOG_PRODUCT,
  CHANGELOG_STATUS,
  CHANGELOG_TRANSLATION_STATUS,
  type ChangelogPlatform,
  type ChangelogProduct,
} from '@/_db/schema/BoffMediaChangelog';
import type {
  ChangelogCtaInputDto,
  ChangelogListQueryDto,
  CreateChangelogDto,
  MarkChangelogSeenDto,
  UpdateChangelogDto,
} from './dto/changelog.dto';
import type {
  ChangelogCtaEntity,
  ChangelogAdminItemEntity,
  ChangelogItemEntity,
  ChangelogListEntity,
  ChangelogSeenEntity,
  ChangelogTranslationEntity,
} from './entities/changelog.entity';
import {
  ChangelogRepository,
  type ChangelogCtaRow,
  type ChangelogRow,
  type ChangelogTranslationRow,
} from './repositories/changelog.repository';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const SUPPORTED_LOCALES = [CHANGELOG_LOCALE.ES, CHANGELOG_LOCALE.EN] as const;

@Injectable()
export class ChangelogService {
  constructor(private readonly repo: ChangelogRepository) {}

  async listPublic(
    query: ChangelogListQueryDto,
    userId?: number,
  ): Promise<ChangelogListEntity> {
    const product = query.product ?? CHANGELOG_PRODUCT.BOFFMEDIA;
    const platform = query.platform ?? CHANGELOG_PLATFORM.WEB;
    const locale = normaliseLocale(query.locale);
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const [rows, state] = await Promise.all([
      this.repo.listPublished(product, platform, limit),
      userId ? this.repo.getState(userId, product) : Promise.resolve(null),
    ]);

    const ids = rows.map((row) => row.id);
    const [translations, ctas] = await Promise.all([
      this.repo.translationsFor(ids),
      this.repo.ctasFor(ids),
    ]);
    const items = rows
      .map((row) =>
        this.toPublicItem(row, translations, ctas, locale, product, platform),
      )
      .filter((item): item is ChangelogItemEntity => item !== null);

    const cursor =
      state?.lastSeenPublishedAt && state.lastSeenEntryId !== null
        ? {
            publishedAt: state.lastSeenPublishedAt,
            entryId: state.lastSeenEntryId,
          }
        : null;
    const unreadCount = await this.repo.countPublishedAfter(
      product,
      platform,
      cursor,
    );
    return { items, hasUnread: unreadCount > 0, unreadCount };
  }

  async markSeen(
    userId: number,
    dto: MarkChangelogSeenDto,
  ): Promise<ChangelogSeenEntity> {
    const row = await this.repo.findPublishedById(dto.entryId);
    if (!row || !isVisible(row, dto.product, dto.platform)) {
      throw new NotFoundError(
        ApiErrorCode.CHANGELOG_ENTRY_NOT_FOUND,
        'Changelog entry not found',
      );
    }
    if (!row.publishedAt) {
      throw new ValidationError(
        ApiErrorCode.CHANGELOG_CONTENT_INVALID,
        'Entry is not published',
      );
    }
    await this.repo.advanceState(userId, dto.product, {
      publishedAt: row.publishedAt,
      entryId: row.id,
    });
    return { success: true };
  }

  async listAdmin(filters: {
    product?: ChangelogProduct;
    platform?: ChangelogPlatform;
    status?: 'draft' | 'published' | 'unpublished';
  }): Promise<ChangelogAdminItemEntity[]> {
    const rows = await this.repo.listAdmin(filters);
    const ids = rows.map((row) => row.id);
    const [translations, ctas] = await Promise.all([
      this.repo.translationsFor(ids),
      this.repo.ctasFor(ids),
    ]);
    return rows.map((row) => this.toAdminItem(row, translations, ctas));
  }

  async getAdmin(id: number): Promise<ChangelogAdminItemEntity> {
    const row = await this.repo.findById(id);
    if (!row) {
      throw new NotFoundError(
        ApiErrorCode.CHANGELOG_ENTRY_NOT_FOUND,
        'Changelog entry not found',
      );
    }
    const [translations, ctas] = await Promise.all([
      this.repo.translationsFor([id]),
      this.repo.ctasFor([id]),
    ]);
    return this.toAdminItem(row, translations, ctas);
  }

  async create(
    dto: CreateChangelogDto,
    actorId: number,
  ): Promise<ChangelogAdminItemEntity> {
    validateContent(dto.translations, dto.ctas);
    const id = await this.repo.insertChangelog({
      product: dto.product,
      platform: dto.platform,
      version: dto.version?.trim() || null,
      status: CHANGELOG_STATUS.DRAFT,
      publishedAt: null,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.saveContent(id, dto.translations, dto.ctas);
    return this.getAdmin(id);
  }

  async update(
    id: number,
    dto: UpdateChangelogDto,
    actorId: number,
  ): Promise<ChangelogAdminItemEntity> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError(
        ApiErrorCode.CHANGELOG_ENTRY_NOT_FOUND,
        'Changelog entry not found',
      );
    }
    if (dto.translations) validateContent(dto.translations, dto.ctas);
    else if (dto.ctas) validateCtas(dto.ctas);
    const patch: Record<string, unknown> = { updatedBy: actorId };
    if (dto.product !== undefined) patch.product = dto.product;
    if (dto.platform !== undefined) patch.platform = dto.platform;
    if (dto.version !== undefined) patch.version = dto.version?.trim() || null;
    await this.repo.updateChangelog(id, patch);
    if (dto.translations || dto.ctas) {
      const translations =
        dto.translations ??
        (await this.repo.translationsFor([id])).map((translation) => ({
          locale: translation.locale,
          title: translation.title,
          summary: translation.summary ?? undefined,
          body: translation.body,
          ctaLabel: translation.ctaLabel ?? undefined,
          status: translation.status,
        }));
      await this.saveContent(id, translations, dto.ctas);
    }
    return this.getAdmin(id);
  }

  async publish(
    id: number,
    actorId: number,
  ): Promise<ChangelogAdminItemEntity> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError(
        ApiErrorCode.CHANGELOG_ENTRY_NOT_FOUND,
        'Changelog entry not found',
      );
    }
    const translations = await this.repo.translationsFor([id]);
    const spanish = translations.find(
      (translation) =>
        translation.locale === CHANGELOG_LOCALE.ES &&
        translation.status === CHANGELOG_TRANSLATION_STATUS.REVIEWED,
    );
    if (!spanish) {
      throw new ValidationError(
        ApiErrorCode.CHANGELOG_SPANISH_REVIEW_REQUIRED,
        'A reviewed Spanish translation is required before publishing',
      );
    }
    await this.repo.updateChangelog(id, {
      status: CHANGELOG_STATUS.PUBLISHED,
      publishedAt: existing.publishedAt ?? new Date(),
      updatedBy: actorId,
    });
    return this.getAdmin(id);
  }

  async unpublish(
    id: number,
    actorId: number,
  ): Promise<ChangelogAdminItemEntity> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError(
        ApiErrorCode.CHANGELOG_ENTRY_NOT_FOUND,
        'Changelog entry not found',
      );
    }
    await this.repo.updateChangelog(id, {
      status: CHANGELOG_STATUS.UNPUBLISHED,
      updatedBy: actorId,
    });
    return this.getAdmin(id);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError(
        ApiErrorCode.CHANGELOG_ENTRY_NOT_FOUND,
        'Changelog entry not found',
      );
    }
    if (existing.status !== CHANGELOG_STATUS.DRAFT) {
      throw new ValidationError(
        ApiErrorCode.CHANGELOG_CONTENT_INVALID,
        'Only draft entries can be deleted',
      );
    }
    await this.repo.deleteDraft(id);
    return { success: true };
  }

  private async saveContent(
    id: number,
    translations: CreateChangelogDto['translations'],
    ctas?: ChangelogCtaInputDto[],
  ): Promise<void> {
    await this.repo.replaceTranslations(
      id,
      translations.map((translation) => ({
        changelogId: id,
        locale: translation.locale,
        title: translation.title.trim(),
        summary: translation.summary?.trim() || null,
        body: translation.body,
        ctaLabel: translation.ctaLabel?.trim() || null,
        status: translation.status ?? CHANGELOG_TRANSLATION_STATUS.DRAFT,
      })),
    );
    if (ctas) {
      await this.repo.replaceCtas(
        id,
        ctas.map((cta) => ({ ...cta, changelogId: id })),
      );
    }
  }

  private toPublicItem(
    row: ChangelogRow,
    translations: ChangelogTranslationRow[],
    ctas: ChangelogCtaRow[],
    locale: string,
    product: ChangelogProduct,
    platform: ChangelogPlatform,
  ): ChangelogItemEntity | null {
    const entryTranslations = translations.filter(
      (t) => t.changelogId === row.id,
    );
    const spanish = entryTranslations.find(
      (t) => t.locale === CHANGELOG_LOCALE.ES && t.status === 'reviewed',
    );
    if (!spanish || !row.publishedAt) return null;
    const preferred =
      locale === CHANGELOG_LOCALE.EN
        ? entryTranslations.find(
            (t) => t.locale === CHANGELOG_LOCALE.EN && t.status === 'reviewed',
          )
        : spanish;
    const selected = preferred ?? spanish;
    const cta = resolveCta(
      ctas.filter((item) => item.changelogId === row.id),
      product,
      platform,
    );
    return {
      id: row.id,
      product: row.product,
      platform: row.platform,
      version: row.version,
      publishedAt: row.publishedAt.toISOString(),
      translation: toTranslationEntity(selected),
      cta: cta ? toCtaEntity(cta) : null,
    };
  }

  private toAdminItem(
    row: ChangelogRow,
    translations: ChangelogTranslationRow[],
    ctas: ChangelogCtaRow[],
  ): ChangelogAdminItemEntity {
    return {
      id: row.id,
      product: row.product,
      platform: row.platform,
      version: row.version,
      status: row.status,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      translations: translations
        .filter((t) => t.changelogId === row.id)
        .map((t) => ({ ...toTranslationEntity(t), status: t.status })),
      ctas: ctas.filter((cta) => cta.changelogId === row.id).map(toCtaEntity),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

function normaliseLocale(locale?: string): string {
  const base = (locale ?? CHANGELOG_LOCALE.ES).toLowerCase().split('-')[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(base)
    ? base
    : CHANGELOG_LOCALE.ES;
}

function isVisible(
  row: ChangelogRow,
  product: string,
  platform: string,
): boolean {
  return (
    (row.product === product || row.product === CHANGELOG_PRODUCT.ALL) &&
    (row.platform === platform || row.platform === CHANGELOG_PLATFORM.ALL)
  );
}

function validateContent(
  translations: CreateChangelogDto['translations'],
  ctas?: ChangelogCtaInputDto[],
): void {
  if (!translations?.length)
    throw new ValidationError(
      ApiErrorCode.CHANGELOG_CONTENT_INVALID,
      'At least one translation is required',
    );
  const locales = new Set<string>();
  for (const translation of translations) {
    if (!translation.title.trim() || !translation.body.trim()) {
      throw new ValidationError(
        ApiErrorCode.CHANGELOG_CONTENT_INVALID,
        'Translation title and body are required',
      );
    }
    if (locales.has(translation.locale)) {
      throw new ValidationError(
        ApiErrorCode.CHANGELOG_CONTENT_INVALID,
        `Duplicate translation locale: ${translation.locale}`,
      );
    }
    locales.add(translation.locale);
  }
  if (ctas) validateCtas(ctas);
}

function validateCtas(ctas: ChangelogCtaInputDto[]): void {
  const targets = new Set<string>();
  for (const cta of ctas) {
    const key = `${cta.product}:${cta.platform}`;
    if (targets.has(key))
      throw new ValidationError(
        ApiErrorCode.CHANGELOG_CONTENT_INVALID,
        `Duplicate CTA target: ${key}`,
      );
    if (!isSafeCtaUrl(cta.url)) {
      throw new ValidationError(
        ApiErrorCode.CHANGELOG_CONTENT_INVALID,
        `Unsafe CTA URL: ${cta.url}`,
      );
    }
    targets.add(key);
  }
}

function isSafeCtaUrl(value: string): boolean {
  const url = value.trim();
  if (!url || url.startsWith('//')) return false;
  if (url.startsWith('/') || url.startsWith('#')) return true;
  try {
    return ['http:', 'https:', 'mailto:'].includes(
      new URL(url).protocol.toLowerCase(),
    );
  } catch {
    return false;
  }
}

function resolveCta(
  ctas: ChangelogCtaRow[],
  product: string,
  platform: string,
) {
  const targets = [
    [product, platform],
    [product, CHANGELOG_PLATFORM.ALL],
    [CHANGELOG_PRODUCT.ALL, platform],
    [CHANGELOG_PRODUCT.ALL, CHANGELOG_PLATFORM.ALL],
  ];
  return (
    targets
      .map(([targetProduct, targetPlatform]) =>
        ctas.find(
          (cta) =>
            cta.product === targetProduct && cta.platform === targetPlatform,
        ),
      )
      .find(Boolean) ?? null
  );
}

function toTranslationEntity(
  row: ChangelogTranslationRow,
): ChangelogTranslationEntity {
  return {
    id: row.id,
    locale: row.locale,
    title: row.title,
    summary: row.summary,
    body: row.body,
    ctaLabel: row.ctaLabel,
  };
}

function toCtaEntity(row: {
  id: number;
  product: string;
  platform: string;
  url: string;
}): ChangelogCtaEntity {
  return {
    id: row.id,
    product: row.product,
    platform: row.platform,
    url: row.url,
  };
}
