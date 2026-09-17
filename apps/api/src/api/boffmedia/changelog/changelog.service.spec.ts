import { ValidationError } from '@/common/errors/domain-error';

import { CHANGELOG_STATUS } from '@/_db/schema/BoffMediaChangelog';
import { ChangelogService } from './changelog.service';
import type {
  ChangelogCtaRow,
  ChangelogRepository,
  ChangelogRow,
  ChangelogTranslationRow,
} from './repositories/changelog.repository';

function row(overrides: Partial<ChangelogRow> = {}): ChangelogRow {
  return {
    id: 1,
    product: 'boffmedia',
    platform: 'web',
    version: '0.10.0',
    status: CHANGELOG_STATUS.PUBLISHED,
    publishedAt: new Date('2026-09-10T12:00:00.000Z'),
    createdBy: null,
    updatedBy: null,
    createdAt: new Date('2026-09-10T11:00:00.000Z'),
    updatedAt: new Date('2026-09-10T11:00:00.000Z'),
    ...overrides,
  } as ChangelogRow;
}

function translation(
  overrides: Partial<ChangelogTranslationRow> = {},
): ChangelogTranslationRow {
  return {
    id: 1,
    changelogId: 1,
    locale: 'es',
    title: 'Novedad',
    summary: null,
    body: 'Contenido',
    ctaLabel: 'Abrir',
    status: 'reviewed',
    createdAt: new Date('2026-09-10T11:00:00.000Z'),
    updatedAt: new Date('2026-09-10T11:00:00.000Z'),
    ...overrides,
  } as ChangelogTranslationRow;
}

function cta(overrides: Partial<ChangelogCtaRow> = {}): ChangelogCtaRow {
  return {
    id: 1,
    changelogId: 1,
    product: 'all',
    platform: 'all',
    url: '/default',
    createdAt: new Date('2026-09-10T11:00:00.000Z'),
    updatedAt: new Date('2026-09-10T11:00:00.000Z'),
    ...overrides,
  } as ChangelogCtaRow;
}

function setup() {
  const repo = {
    listPublished: jest.fn(),
    getState: jest.fn(),
    translationsFor: jest.fn(),
    ctasFor: jest.fn(),
    countPublishedAfter: jest.fn(),
    findPublishedById: jest.fn(),
    advanceState: jest.fn(),
    findById: jest.fn(),
    updateChangelog: jest.fn(),
  } as unknown as jest.Mocked<ChangelogRepository>;
  return { repo, service: new ChangelogService(repo) };
}

describe('ChangelogService', () => {
  it('uses the requested locale, exact CTA target, and product cursor', async () => {
    const { repo, service } = setup();
    const published = row();
    repo.listPublished.mockResolvedValue([published]);
    repo.getState.mockResolvedValue({
      userId: 7,
      product: 'boffmedia',
      lastSeenPublishedAt: new Date('2026-09-09T12:00:00.000Z'),
      lastSeenEntryId: 4,
      updatedAt: new Date('2026-09-09T12:00:00.000Z'),
    });
    repo.translationsFor.mockResolvedValue([
      translation(),
      translation({
        id: 2,
        locale: 'en',
        title: 'Update',
        status: 'reviewed',
      }),
    ]);
    repo.ctasFor.mockResolvedValue([
      cta({ id: 1, product: 'all', platform: 'all', url: '/fallback' }),
      cta({ id: 2, product: 'all', platform: 'web', url: '/all-web' }),
      cta({ id: 3, product: 'boffmedia', platform: 'all', url: '/boff-all' }),
      cta({ id: 4, product: 'boffmedia', platform: 'web', url: '/exact' }),
    ]);
    repo.countPublishedAfter.mockResolvedValue(3);

    const result = await service.listPublic(
      { product: 'boffmedia', platform: 'web', locale: 'en', limit: 50 },
      7,
    );

    expect(result.items[0]?.translation.title).toBe('Update');
    expect(result.items[0]?.cta?.url).toBe('/exact');
    expect(result.hasUnread).toBe(true);
    expect(result.unreadCount).toBe(3);
    expect(repo.getState).toHaveBeenCalledWith(7, 'boffmedia');
    expect(repo.countPublishedAfter).toHaveBeenCalledWith('boffmedia', 'web', {
      publishedAt: new Date('2026-09-09T12:00:00.000Z'),
      entryId: 4,
    });
  });

  it('derives the seen cursor from a published entry and validates visibility', async () => {
    const { repo, service } = setup();
    const published = row({ product: 'all', platform: 'all' });
    repo.findPublishedById.mockResolvedValue(published);
    repo.advanceState.mockResolvedValue();

    await expect(
      service.markSeen(7, {
        entryId: 1,
        product: 'smartrotom',
        platform: 'web',
      }),
    ).resolves.toEqual({ success: true });

    expect(repo.advanceState).toHaveBeenCalledWith(7, 'smartrotom', {
      publishedAt: published.publishedAt,
      entryId: published.id,
    });
  });

  it('does not publish without a reviewed Spanish translation', async () => {
    const { repo, service } = setup();
    repo.findById.mockResolvedValue(row({ status: 'draft' }));
    repo.translationsFor.mockResolvedValue([
      translation({ status: 'translated' }),
    ]);

    await expect(service.publish(1, 7)).rejects.toBeInstanceOf(ValidationError);
    expect(repo.updateChangelog).not.toHaveBeenCalled();
  });
});
