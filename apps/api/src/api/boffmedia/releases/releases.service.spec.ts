import { AuditService } from '@api/_repositories/audit.service';
import {
  type BoffMediaDeployment,
  type BoffMediaRelease,
} from '@/_db/schema/BoffMediaReleases';
import { ApiErrorCode } from '@/common/errors/error-codes.generated';
import { ReleasesService } from './releases.service';
import type {
  CreateFragmentReleaseDto,
  CreateReleaseDto,
  ListReleasesQueryDto,
  RecordDeploymentDto,
} from './dto/releases.dto';
import {
  ReleaseEntryBundle,
  ReleasesRepository,
} from './repositories/releases.repository';

function makeRelease(
  overrides: Partial<BoffMediaRelease> = {},
): BoffMediaRelease {
  const now = new Date('2026-09-13T12:00:00.000Z');
  return {
    id: 1,
    version: '0.9.1',
    status: 'draft',
    creationSource: 'fragments',
    changelogMode: 'entries',
    requiredSurfaces: ['web', 'api'],
    sourceCommitSha: 'a'.repeat(40),
    versionFileSha: 'b'.repeat(64),
    createdBy: null,
    approvedAt: null,
    approvedBy: null,
    publishedAt: null,
    withdrawnAt: null,
    withdrawnBy: null,
    withdrawalReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeDeployment(
  overrides: Partial<BoffMediaDeployment> = {},
): BoffMediaDeployment {
  const now = new Date('2026-09-13T12:00:00.000Z');
  return {
    id: 10,
    releaseId: 1,
    surface: 'web',
    environment: 'production',
    productVersion: '0.9.1',
    buildId: 'web-123',
    gitSha: 'a'.repeat(40),
    versionFileSha: 'b'.repeat(64),
    status: 'verified',
    healthCheckUrl: 'https://boffmedia.es/version',
    healthCheckedAt: now,
    failureReason: null,
    metadata: null,
    idempotencyKey: 'production:web:0.9.1:web-123',
    recordedBy: 'deployment-automation',
    deployedAt: now,
    createdAt: now,
    ...overrides,
  };
}

describe('ReleasesService', () => {
  let service: ReleasesService;
  let repository: jest.Mocked<ReleasesRepository>;
  let audit: jest.Mocked<Pick<AuditService, 'record'>>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByVersion: jest.fn(),
      listPublished: jest.fn(),
      listAll: jest.fn(),
      create: jest.fn(),
      createFromFragments: jest.fn(),
      entriesForReleases: jest.fn(),
      viewsForUser: jest.fn(),
      markSeen: jest.fn(),
      registeredFragmentIds: jest.fn(),
      createDeployment: jest.fn(),
      verifiedSurfaces: jest.fn(),
      markPublishedIfReady: jest.fn(),
      approve: jest.fn(),
      withdraw: jest.fn(),
      archive: jest.fn(),
      readiness: jest.fn(),
      claimFragment: jest.fn(),
    } as unknown as jest.Mocked<ReleasesRepository>;
    audit = { record: jest.fn() } as unknown as jest.Mocked<
      Pick<AuditService, 'record'>
    >;
    service = new ReleasesService(repository, audit as unknown as AuditService);
  });

  it('rejects a leading-v version and accepts strict semantic versions', async () => {
    const input = {
      version: 'v0.9.1',
      requiredSurfaces: ['web'],
      versionFileSha: 'b'.repeat(64),
    } as CreateReleaseDto;

    await expect(service.createManual(input, 7)).rejects.toMatchObject({
      code: ApiErrorCode.RELEASE_INVALID_INPUT,
      statusCode: 400,
    });
    expect(repository.findByVersion).not.toHaveBeenCalled();
  });

  it('returns stable releases newest first and falls back to English', async () => {
    const newest = makeRelease({
      id: 2,
      version: '0.10.0',
      status: 'published',
    });
    const older = makeRelease({ id: 1, version: '0.9.1', status: 'published' });
    const prerelease = makeRelease({
      id: 3,
      version: '0.11.0-beta.1',
      status: 'published',
    });
    repository.listPublished.mockResolvedValue([older, prerelease, newest]);
    repository.entriesForReleases.mockResolvedValue([
      {
        entry: {
          id: 20,
          releaseId: 2,
          type: 'improvement',
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        translations: [
          {
            id: 20,
            entryId: 20,
            locale: 'en',
            title: 'Faster reports',
            description: 'Reports load faster.',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ] as ReleaseEntryBundle[]);
    repository.viewsForUser.mockResolvedValue(new Set([2]));

    const result = await service.listPublic(
      { locale: 'es', limit: 20 } as ListReleasesQueryDto,
      42,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 2,
      version: '0.10.0',
      seen: true,
    });
    expect(result[0].entries[0]).toMatchObject({
      title: 'Faster reports',
      locale: 'en',
    });
  });

  it('does not publish when a required production surface has failed', async () => {
    const draft = makeRelease();
    repository.findByVersion.mockResolvedValue(draft);
    repository.createDeployment.mockResolvedValue(
      makeDeployment({
        status: 'failed',
        failureReason: 'health check failed',
      }),
    );
    repository.markPublishedIfReady.mockResolvedValue(false);
    repository.findById.mockResolvedValue(draft);
    repository.readiness.mockResolvedValue({
      releaseId: draft.id,
      version: draft.version,
      requiredSurfaces: draft.requiredSurfaces,
      verifiedSurfaces: [],
      missingSurfaces: draft.requiredSurfaces,
      eligible: false,
    });

    const result = await service.recordDeployment(
      {
        surface: 'web',
        environment: 'production',
        productVersion: draft.version,
        buildId: 'web-123',
        versionFileSha: draft.versionFileSha!,
        status: 'failed',
        idempotencyKey: 'production:web:0.9.1:web-123',
      } as RecordDeploymentDto,
      'deployment-automation',
    );

    expect(result.releasePublished).toBe(false);
    expect(repository.markPublishedIfReady).toHaveBeenCalledWith(draft);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'release.deployment_recorded' }),
    );
  });

  it('publishes automatically once the final required deployment is verified', async () => {
    const draft = makeRelease({ approvedAt: new Date(), approvedBy: 7 });
    const published = makeRelease({
      status: 'published',
      approvedAt: draft.approvedAt,
      approvedBy: draft.approvedBy,
      publishedAt: new Date(),
    });
    repository.findByVersion.mockResolvedValue(draft);
    repository.createDeployment.mockResolvedValue(makeDeployment());
    repository.markPublishedIfReady.mockResolvedValue(true);
    repository.findById.mockResolvedValue(published);
    repository.readiness.mockResolvedValue({
      releaseId: published.id,
      version: published.version,
      requiredSurfaces: published.requiredSurfaces,
      verifiedSurfaces: ['web', 'api'],
      missingSurfaces: [],
      eligible: true,
    });

    const result = await service.recordDeployment(
      {
        surface: 'web',
        environment: 'production',
        productVersion: draft.version,
        buildId: 'web-123',
        versionFileSha: draft.versionFileSha!,
        status: 'verified',
        healthCheckUrl: 'https://boffmedia.es/version',
        healthCheckedAt: '2026-09-13T12:00:00.000Z',
        idempotencyKey: 'production:web:0.9.1:web-123',
      } as RecordDeploymentDto,
      'deployment-automation',
    );

    expect(result.releasePublished).toBe(true);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'release.auto_published' }),
    );
  });

  it('accepts an explicit no-changelog release without fragments', async () => {
    const dto = {
      version: '0.9.2',
      requiredSurfaces: ['api'],
      changelogMode: 'none',
      versionFileSha: 'c'.repeat(64),
      fragments: [],
    } as CreateFragmentReleaseDto;
    const release = makeRelease({
      version: dto.version,
      requiredSurfaces: ['api'],
      changelogMode: 'none',
      versionFileSha: dto.versionFileSha,
    });
    repository.findByVersion.mockResolvedValue(null);
    repository.createFromFragments.mockResolvedValue(release.id);
    repository.findById.mockResolvedValue(release);
    repository.entriesForReleases.mockResolvedValue([]);

    const result = await service.createFromFragments(dto);

    expect(result.changelogMode).toBe('none');
    expect(repository.createFromFragments).toHaveBeenCalledWith(
      expect.objectContaining({ fragments: [] }),
    );
  });

  it('archives a draft and records the release-specific audit event', async () => {
    const draft = makeRelease();
    const archived = makeRelease({ status: 'archived' });
    repository.findById.mockResolvedValue(draft);
    repository.archive.mockResolvedValue(archived);
    repository.entriesForReleases.mockResolvedValue([]);

    const result = await service.archive(draft.id, 7);

    expect(result.status).toBe('archived');
    expect(repository.archive).toHaveBeenCalledWith(draft.id);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'release.archived' }),
    );
  });
});
