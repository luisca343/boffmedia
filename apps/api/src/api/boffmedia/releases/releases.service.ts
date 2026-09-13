import { Injectable } from '@nestjs/common';
import { AuditService } from '@api/_repositories/audit.service';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/common/errors/domain-error';
import { ApiErrorCode } from '@/common/errors/error-codes.generated';
import {
  type BoffMediaDeployment,
  type BoffMediaRelease,
  type ReleaseLocale,
  type ReleaseSurface,
} from '@/_db/schema/BoffMediaReleases';
import {
  compareReleaseVersions,
  isStableReleaseVersion,
  normalizeReleaseVersion,
} from '@api/version/release-version';
import type {
  CreateFragmentReleaseDto,
  CreateReleaseDto,
  ListReleasesQueryDto,
  RecordDeploymentDto,
  WithdrawReleaseDto,
} from './dto/releases.dto';
import {
  DeploymentEntity,
  DeploymentResultEntity,
  ReleaseEntity,
  ReleaseEntryEntity,
  ReleaseFragmentRegistryEntity,
  ReleaseReadinessEntity,
} from './entities/releases.entity';
import {
  ReleaseEntryBundle,
  ReleasesRepository,
} from './repositories/releases.repository';

@Injectable()
export class ReleasesService {
  constructor(
    private readonly repository: ReleasesRepository,
    private readonly audit: AuditService,
  ) {}

  async listPublic(query: ListReleasesQueryDto, userId?: number) {
    const locale = query.locale ?? 'en';
    const after = query.after
      ? normalizeReleaseVersion(query.after)
      : undefined;
    const rows = (await this.repository.listPublished())
      .filter((row) => isStableReleaseVersion(row.version))
      .filter((row) => !after || compareReleaseVersions(row.version, after) > 0)
      .sort((a, b) => compareReleaseVersions(b.version, a.version))
      .slice(0, Math.min(Math.max(query.limit ?? 20, 1), 100));

    const entries = await this.repository.entriesForReleases(
      rows.map((row) => row.id),
    );
    const views = userId
      ? await this.repository.viewsForUser(
          userId,
          rows.map((row) => row.id),
        )
      : new Set<number>();

    return rows
      .map((row) => {
        const localizedEntries = entries
          .filter((bundle) => bundle.entry.releaseId === row.id)
          .map((bundle) => this.localizeEntry(bundle, locale))
          .filter((entry): entry is ReleaseEntryEntity => entry !== null)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        return {
          ...this.toPublicEntity(row, localizedEntries),
          seen: userId ? views.has(row.id) : false,
        };
      })
      .filter((row) => row.entries.length > 0);
  }

  async listAdmin(): Promise<ReleaseEntity[]> {
    const rows = await this.repository.listAll();
    const entries = await this.repository.entriesForReleases(
      rows.map((row) => row.id),
    );
    return rows.map((row) =>
      this.toAdminEntity(
        row,
        entries
          .filter((bundle) => bundle.entry.releaseId === row.id)
          .map((bundle) => this.localizeEntry(bundle, 'en'))
          .filter((entry): entry is ReleaseEntryEntity => entry !== null),
      ),
    );
  }

  async createManual(
    dto: CreateReleaseDto,
    actorId: number,
  ): Promise<ReleaseEntity> {
    const version = this.assertVersion(dto.version);
    const existing = await this.repository.findByVersion(version);
    if (existing) {
      throw new ConflictError(
        ApiErrorCode.RELEASE_VERSION_CONFLICT,
        `Release ${version} already exists`,
      );
    }

    try {
      const row = await this.repository.create({
        version,
        status: 'draft',
        creationSource: 'manual',
        changelogMode: dto.changelogMode ?? 'entries',
        requiredSurfaces: this.uniqueSurfaces(dto.requiredSurfaces),
        sourceCommitSha: dto.sourceCommitSha ?? null,
        versionFileSha: dto.versionFileSha,
        createdBy: actorId,
      });
      await this.auditRelease(actorId, 'release.created', row.id, {
        creationSource: 'manual',
        version,
      });
      return this.toAdminEntity(row, []);
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError(
          ApiErrorCode.RELEASE_VERSION_CONFLICT,
          `Release ${version} already exists`,
        );
      }
      throw error;
    }
  }

  async createFromFragments(
    dto: CreateFragmentReleaseDto,
  ): Promise<ReleaseEntity> {
    const version = this.assertVersion(dto.version);
    const sourceCommitSha = dto.sourceCommitSha ?? 'unknown';
    const versionFileSha = dto.versionFileSha;
    const existing = await this.repository.findByVersion(version);
    if (existing) {
      // A retried CI job must be safe. The source and manifest hashes make
      // this idempotent only for the exact fragment-backed release that was
      // already created; changed editorial input still requires a correction.
      if (
        existing.creationSource === 'fragments' &&
        existing.sourceCommitSha === sourceCommitSha &&
        existing.versionFileSha === versionFileSha
      ) {
        const bundles = await this.repository.entriesForReleases([existing.id]);
        return this.toAdminEntity(
          existing,
          bundles
            .map((bundle) => this.localizeEntry(bundle, 'en'))
            .filter((entry): entry is ReleaseEntryEntity => entry !== null),
        );
      }
      throw new ConflictError(
        ApiErrorCode.RELEASE_VERSION_CONFLICT,
        `Release ${version} already exists`,
      );
    }
    const changelogMode = dto.changelogMode ?? 'entries';
    if (changelogMode === 'entries' && dto.fragments.length === 0) {
      throw new ValidationError(
        ApiErrorCode.RELEASE_INVALID_INPUT,
        'An entries release must contain at least one fragment',
      );
    }
    if (changelogMode === 'none' && dto.fragments.length > 0) {
      throw new ValidationError(
        ApiErrorCode.RELEASE_INVALID_INPUT,
        'A no-changelog release cannot contain fragments',
      );
    }

    const duplicateFragmentIds = new Set<string>();
    for (const fragment of dto.fragments) {
      if (duplicateFragmentIds.has(fragment.fragmentId)) {
        throw new ValidationError(
          ApiErrorCode.RELEASE_INVALID_INPUT,
          `Duplicate fragment id: ${fragment.fragmentId}`,
        );
      }
      duplicateFragmentIds.add(fragment.fragmentId);
      if (Boolean(fragment.titleEs) !== Boolean(fragment.descriptionEs)) {
        throw new ValidationError(
          ApiErrorCode.RELEASE_INVALID_INPUT,
          `Spanish translation is incomplete for fragment ${fragment.fragmentId}`,
        );
      }
    }

    try {
      const id = await this.repository.createFromFragments({
        release: {
          version,
          status: 'draft',
          creationSource: 'fragments',
          changelogMode,
          requiredSurfaces: this.uniqueSurfaces(dto.requiredSurfaces),
          sourceCommitSha,
          versionFileSha,
          createdBy: null,
        },
        fragments: dto.fragments.map((fragment) => ({
          ...fragment,
          sourceCommitSha,
        })),
      });
      await this.auditRelease('release-automation', 'release.created', id, {
        creationSource: 'fragments',
        version,
        fragmentCount: dto.fragments.length,
      });
      const row = await this.requireRelease(id);
      const bundles = await this.repository.entriesForReleases([id]);
      return this.toAdminEntity(
        row,
        bundles
          .map((bundle) => this.localizeEntry(bundle, 'en'))
          .filter((entry): entry is ReleaseEntryEntity => entry !== null),
      );
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        const concurrent = await this.repository.findByVersion(version);
        if (
          concurrent?.creationSource === 'fragments' &&
          concurrent.sourceCommitSha === sourceCommitSha &&
          concurrent.versionFileSha === versionFileSha
        ) {
          const bundles = await this.repository.entriesForReleases([
            concurrent.id,
          ]);
          return this.toAdminEntity(
            concurrent,
            bundles
              .map((bundle) => this.localizeEntry(bundle, 'en'))
              .filter((entry): entry is ReleaseEntryEntity => entry !== null),
          );
        }
        throw new ConflictError(
          ApiErrorCode.RELEASE_VERSION_CONFLICT,
          `Release ${version} or one of its fragments already exists`,
        );
      }
      throw error;
    }
  }

  async approve(id: number, actorId: number): Promise<ReleaseEntity> {
    const current = await this.requireRelease(id);
    if (current.status !== 'draft') {
      throw new ValidationError(
        ApiErrorCode.RELEASE_INVALID_STATE,
        'Only draft releases can be approved',
      );
    }

    const row = await this.repository.approve(id, actorId);
    if (!row) {
      throw new NotFoundError(
        ApiErrorCode.RELEASE_NOT_FOUND,
        'Release not found',
      );
    }
    await this.auditRelease(actorId, 'release.approved', id, {
      version: row.version,
    });
    await this.tryPublish(row);
    const published = await this.requireRelease(id);
    return this.toAdminEntity(published, []);
  }

  async withdraw(
    id: number,
    dto: WithdrawReleaseDto,
    actorId: number,
  ): Promise<ReleaseEntity> {
    const current = await this.requireRelease(id);
    if (current.status !== 'published' || current.withdrawnAt) {
      throw new ValidationError(
        ApiErrorCode.RELEASE_INVALID_STATE,
        'Only an active published release can be withdrawn',
      );
    }
    const row = await this.repository.withdraw(id, actorId, dto.reason.trim());
    if (!row) {
      throw new NotFoundError(
        ApiErrorCode.RELEASE_NOT_FOUND,
        'Release not found',
      );
    }
    await this.auditRelease(actorId, 'release.withdrawn', id, {
      version: row.version,
      reason: dto.reason.trim(),
    });
    return this.toAdminEntity(row, []);
  }

  async archive(id: number, actorId: number): Promise<ReleaseEntity> {
    const current = await this.requireRelease(id);
    if (current.status !== 'draft') {
      throw new ValidationError(
        ApiErrorCode.RELEASE_INVALID_STATE,
        'Only draft releases can be archived',
      );
    }
    const row = await this.repository.archive(id);
    if (!row) {
      throw new NotFoundError(
        ApiErrorCode.RELEASE_NOT_FOUND,
        'Release not found',
      );
    }
    await this.auditRelease(actorId, 'release.archived', id, {
      version: row.version,
    });
    const bundles = await this.repository.entriesForReleases([id]);
    return this.toAdminEntity(
      row,
      bundles
        .map((bundle) => this.localizeEntry(bundle, 'en'))
        .filter((entry): entry is ReleaseEntryEntity => entry !== null),
    );
  }

  async readiness(id: number): Promise<ReleaseReadinessEntity> {
    const row = await this.requireRelease(id);
    return this.repository.readiness(row);
  }

  /** Used by the desktop artifact registry to keep the optional FK explicit. */
  async productReleaseIdForVersion(version: string): Promise<number | null> {
    const row = await this.repository.findByVersion(
      this.assertVersion(version),
    );
    return row?.id ?? null;
  }

  async registeredFragments(): Promise<ReleaseFragmentRegistryEntity> {
    return { fragmentIds: await this.repository.registeredFragmentIds() };
  }

  async markSeen(id: number, userId: number): Promise<{ success: true }> {
    const row = await this.requireRelease(id);
    if (row.status !== 'published' || !isStableReleaseVersion(row.version)) {
      throw new NotFoundError(
        ApiErrorCode.RELEASE_NOT_FOUND,
        'Release not found',
      );
    }
    await this.repository.markSeen(id, userId);
    return { success: true };
  }

  async recordDeployment(
    dto: RecordDeploymentDto,
    recordedBy: string,
  ): Promise<DeploymentResultEntity> {
    const productVersion = this.assertVersion(dto.productVersion);
    let release: BoffMediaRelease | null = null;

    if (dto.releaseId !== undefined) {
      release = await this.requireRelease(dto.releaseId);
      if (release.version !== productVersion) {
        throw new ValidationError(
          ApiErrorCode.RELEASE_DEPLOYMENT_MISMATCH,
          'Deployment version does not match the product release',
        );
      }
      if (release.versionFileSha !== (dto.versionFileSha ?? null)) {
        throw new ValidationError(
          ApiErrorCode.RELEASE_DEPLOYMENT_MISMATCH,
          'Deployment version manifest does not match the product release',
        );
      }
    } else {
      release = await this.repository.findByVersion(productVersion);
      if (release && release.versionFileSha !== (dto.versionFileSha ?? null)) {
        throw new ValidationError(
          ApiErrorCode.RELEASE_DEPLOYMENT_MISMATCH,
          'Deployment version manifest does not match the product release',
        );
      }
    }

    const deployment = await this.repository.createDeployment({
      releaseId: release?.id ?? null,
      surface: dto.surface,
      environment: dto.environment,
      productVersion,
      buildId: dto.buildId,
      gitSha: dto.gitSha ?? null,
      versionFileSha: dto.versionFileSha ?? null,
      status: dto.status,
      healthCheckUrl: dto.healthCheckUrl ?? null,
      healthCheckedAt: dto.healthCheckedAt
        ? new Date(dto.healthCheckedAt)
        : null,
      failureReason: dto.failureReason ?? null,
      idempotencyKey: dto.idempotencyKey,
      recordedBy,
    });

    if (release) {
      await this.auditRelease(
        'deployment-automation',
        'release.deployment_recorded',
        release.id,
        {
          deploymentId: deployment.id,
          surface: dto.surface,
          environment: dto.environment,
          status: dto.status,
          buildId: dto.buildId,
        },
      );
      await this.tryPublish(release);
    }

    const latestRelease = release
      ? await this.requireRelease(release.id)
      : null;
    return {
      deployment: this.toDeploymentEntity(deployment),
      readiness: latestRelease
        ? await this.repository.readiness(latestRelease)
        : null,
      releasePublished: latestRelease?.status === 'published',
    };
  }

  private async tryPublish(release: BoffMediaRelease): Promise<boolean> {
    const published = await this.repository.markPublishedIfReady(release);
    if (!published) return false;
    await this.auditRelease(
      'release-automation',
      'release.auto_published',
      release.id,
      {
        version: release.version,
        requiredSurfaces: release.requiredSurfaces,
      },
    );
    return true;
  }

  private localizeEntry(
    bundle: ReleaseEntryBundle,
    requestedLocale: ReleaseLocale,
  ): ReleaseEntryEntity | null {
    const translation =
      bundle.translations.find((item) => item.locale === requestedLocale) ??
      bundle.translations.find((item) => item.locale === 'en');
    if (!translation) return null;
    return {
      id: bundle.entry.id,
      type: bundle.entry.type,
      sortOrder: bundle.entry.sortOrder,
      title: translation.title,
      description: translation.description,
      locale: translation.locale,
    };
  }

  private toPublicEntity(row: BoffMediaRelease, entries: ReleaseEntryEntity[]) {
    return {
      id: row.id,
      version: row.version,
      requiredSurfaces: row.requiredSurfaces,
      status: row.status,
      creationSource: row.creationSource,
      changelogMode: row.changelogMode,
      approved: Boolean(row.approvedAt),
      published: row.status === 'published',
      withdrawn: Boolean(row.withdrawnAt),
      entries,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      withdrawalReason: row.withdrawalReason,
      sourceCommitSha: row.sourceCommitSha,
      versionFileSha: row.versionFileSha,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toAdminEntity(
    row: BoffMediaRelease,
    entries: ReleaseEntryEntity[],
  ): ReleaseEntity {
    return this.toPublicEntity(row, entries);
  }

  private toDeploymentEntity(row: BoffMediaDeployment): DeploymentEntity {
    return {
      id: row.id,
      releaseId: row.releaseId,
      surface: row.surface,
      environment: row.environment,
      productVersion: row.productVersion,
      buildId: row.buildId,
      gitSha: row.gitSha,
      status: row.status,
      idempotencyKey: row.idempotencyKey,
      recordedBy: row.recordedBy,
      deployedAt: row.deployedAt.toISOString(),
    };
  }

  private async requireRelease(id: number): Promise<BoffMediaRelease> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new NotFoundError(
        ApiErrorCode.RELEASE_NOT_FOUND,
        'Release not found',
      );
    }
    return row;
  }

  private assertVersion(value: string): string {
    try {
      return normalizeReleaseVersion(value);
    } catch {
      throw new ValidationError(
        ApiErrorCode.RELEASE_INVALID_INPUT,
        'version must be valid SemVer',
      );
    }
  }

  private uniqueSurfaces(surfaces: ReleaseSurface[]): ReleaseSurface[] {
    const unique = [...new Set(surfaces)];
    if (unique.length === 0) {
      throw new ValidationError(
        ApiErrorCode.RELEASE_INVALID_INPUT,
        'requiredSurfaces must not be empty',
      );
    }
    return unique;
  }

  private async auditRelease(
    actor: number | string,
    action: string,
    subjectId: number,
    metadata: Record<string, unknown>,
  ) {
    await this.audit.record({
      domain: 'boffmedia',
      actor,
      action,
      subjectType: 'release',
      subjectId,
      metadata,
    });
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === 'ER_DUP_ENTRY',
  );
}
