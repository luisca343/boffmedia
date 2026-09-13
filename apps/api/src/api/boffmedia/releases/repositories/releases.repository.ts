import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffmediaDeployments,
  boffmediaReleaseEntries,
  boffmediaReleaseEntryTranslations,
  boffmediaReleaseFragments,
  boffmediaReleaseViews,
  boffmediaReleases,
  type BoffMediaDeployment,
  type BoffMediaRelease,
  type BoffMediaReleaseEntry,
  type BoffMediaReleaseTranslation,
  type NewBoffMediaRelease,
  type ReleaseEntryType,
  type ReleaseSurface,
} from '@/_db/schema/BoffMediaReleases';
import { isStableReleaseVersion } from '@api/version/release-version';

export interface ReleaseEntryBundle {
  entry: BoffMediaReleaseEntry;
  translations: BoffMediaReleaseTranslation[];
}

@Injectable()
export class ReleasesRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async findById(id: number): Promise<BoffMediaRelease | null> {
    const [row] = await this.db
      .select()
      .from(boffmediaReleases)
      .where(eq(boffmediaReleases.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByVersion(version: string): Promise<BoffMediaRelease | null> {
    const [row] = await this.db
      .select()
      .from(boffmediaReleases)
      .where(eq(boffmediaReleases.version, version))
      .limit(1);
    return row ?? null;
  }

  async listPublished(): Promise<BoffMediaRelease[]> {
    return this.db
      .select()
      .from(boffmediaReleases)
      .where(
        and(
          eq(boffmediaReleases.status, 'published'),
          eq(boffmediaReleases.changelogMode, 'entries'),
        ),
      )
      .orderBy(desc(boffmediaReleases.publishedAt));
  }

  async listAll(): Promise<BoffMediaRelease[]> {
    return this.db
      .select()
      .from(boffmediaReleases)
      .orderBy(desc(boffmediaReleases.createdAt));
  }

  async create(input: NewBoffMediaRelease): Promise<BoffMediaRelease> {
    const result = await this.db.insert(boffmediaReleases).values(input);
    return (await this.findById(result[0].insertId))!;
  }

  async createFromFragments(input: {
    release: NewBoffMediaRelease;
    fragments: Array<{
      fragmentId: string;
      sourcePath: string;
      contentHash: string;
      sourceCommitSha: string;
      type: ReleaseEntryType;
      titleEn: string;
      descriptionEn: string;
      titleEs?: string;
      descriptionEs?: string;
    }>;
  }): Promise<number> {
    return this.db.transaction(async (tx) => {
      const releaseResult = await tx
        .insert(boffmediaReleases)
        .values(input.release);
      const releaseId = releaseResult[0].insertId;

      for (const [sortOrder, fragment] of input.fragments.entries()) {
        const entryResult = await tx.insert(boffmediaReleaseEntries).values({
          releaseId,
          type: fragment.type,
          sortOrder,
        });
        const entryId = entryResult[0].insertId;
        const translations: Array<{
          entryId: number;
          locale: 'en' | 'es';
          title: string;
          description: string;
        }> = [
          {
            entryId,
            locale: 'en' as const,
            title: fragment.titleEn,
            description: fragment.descriptionEn,
          },
        ];
        if (fragment.titleEs && fragment.descriptionEs) {
          translations.push({
            entryId,
            locale: 'es' as const,
            title: fragment.titleEs,
            description: fragment.descriptionEs,
          });
        }
        await tx.insert(boffmediaReleaseEntryTranslations).values(translations);
        await tx.insert(boffmediaReleaseFragments).values({
          releaseId,
          fragmentId: fragment.fragmentId,
          sourcePath: fragment.sourcePath,
          contentHash: fragment.contentHash,
          sourceCommitSha: fragment.sourceCommitSha,
          state: 'claimed',
        });
      }

      return releaseId;
    });
  }

  async entriesForReleases(
    releaseIds: number[],
  ): Promise<ReleaseEntryBundle[]> {
    if (releaseIds.length === 0) return [];
    const entries = await this.db
      .select()
      .from(boffmediaReleaseEntries)
      .where(inArray(boffmediaReleaseEntries.releaseId, releaseIds));
    if (entries.length === 0) return [];

    const translations = await this.db
      .select()
      .from(boffmediaReleaseEntryTranslations)
      .where(
        inArray(
          boffmediaReleaseEntryTranslations.entryId,
          entries.map((e) => e.id),
        ),
      );

    return entries.map((entry) => ({
      entry,
      translations: translations.filter(
        (translation) => translation.entryId === entry.id,
      ),
    }));
  }

  async viewsForUser(
    userId: number,
    releaseIds: number[],
  ): Promise<Set<number>> {
    if (releaseIds.length === 0) return new Set();
    const rows = await this.db
      .select({ releaseId: boffmediaReleaseViews.releaseId })
      .from(boffmediaReleaseViews)
      .where(
        and(
          eq(boffmediaReleaseViews.userId, userId),
          inArray(boffmediaReleaseViews.releaseId, releaseIds),
        ),
      );
    return new Set(rows.map((row) => row.releaseId));
  }

  async markSeen(releaseId: number, userId: number): Promise<void> {
    await this.db
      .insert(boffmediaReleaseViews)
      .values({ releaseId, userId, seenAt: new Date() })
      .onDuplicateKeyUpdate({
        set: { seenAt: new Date() },
      });
  }

  async registeredFragmentIds(): Promise<string[]> {
    const rows = await this.db
      .select({ fragmentId: boffmediaReleaseFragments.fragmentId })
      .from(boffmediaReleaseFragments)
      .where(inArray(boffmediaReleaseFragments.state, ['claimed', 'consumed']));
    return rows.map((row) => row.fragmentId);
  }

  async createDeployment(input: {
    releaseId: number | null;
    surface: ReleaseSurface;
    environment: 'development' | 'staging' | 'production';
    productVersion: string;
    buildId: string;
    gitSha: string | null;
    versionFileSha: string | null;
    status: 'verified' | 'failed';
    healthCheckUrl: string | null;
    healthCheckedAt: Date | null;
    failureReason: string | null;
    idempotencyKey: string;
    recordedBy: string;
    deployedAt?: Date;
  }): Promise<BoffMediaDeployment> {
    await this.db
      .insert(boffmediaDeployments)
      .values(input)
      .onDuplicateKeyUpdate({
        // A retry must return the original immutable evidence, not overwrite it.
        set: { idempotencyKey: sql`${boffmediaDeployments.idempotencyKey}` },
      });

    const [row] = await this.db
      .select()
      .from(boffmediaDeployments)
      .where(eq(boffmediaDeployments.idempotencyKey, input.idempotencyKey))
      .limit(1);
    return row!;
  }

  async verifiedSurfaces(releaseId: number): Promise<Set<ReleaseSurface>> {
    const rows = await this.db
      .select({ surface: boffmediaDeployments.surface })
      .from(boffmediaDeployments)
      .where(
        and(
          eq(boffmediaDeployments.releaseId, releaseId),
          eq(boffmediaDeployments.environment, 'production'),
          eq(boffmediaDeployments.status, 'verified'),
        ),
      );
    return new Set(rows.map((row) => row.surface));
  }

  async markPublishedIfReady(release: BoffMediaRelease): Promise<boolean> {
    if (
      release.status !== 'draft' ||
      !release.approvedAt ||
      !isStableReleaseVersion(release.version)
    ) {
      return false;
    }

    const required = release.requiredSurfaces;
    const verified = await this.verifiedSurfaces(release.id);
    if (!required.every((surface) => verified.has(surface))) return false;

    const result = await this.db
      .update(boffmediaReleases)
      .set({ status: 'published', publishedAt: new Date() })
      .where(
        and(
          eq(boffmediaReleases.id, release.id),
          eq(boffmediaReleases.status, 'draft'),
        ),
      );
    if (result[0].affectedRows === 0) return false;
    await this.db
      .update(boffmediaReleaseFragments)
      .set({ state: 'consumed', consumedAt: new Date() })
      .where(
        and(
          eq(boffmediaReleaseFragments.releaseId, release.id),
          eq(boffmediaReleaseFragments.state, 'claimed'),
        ),
      );
    return true;
  }

  async approve(id: number, actorId: number): Promise<BoffMediaRelease | null> {
    await this.db
      .update(boffmediaReleases)
      .set({ approvedAt: new Date(), approvedBy: actorId })
      .where(
        and(
          eq(boffmediaReleases.id, id),
          eq(boffmediaReleases.status, 'draft'),
        ),
      );
    return this.findById(id);
  }

  async withdraw(
    id: number,
    actorId: number,
    reason: string,
  ): Promise<BoffMediaRelease | null> {
    await this.db
      .update(boffmediaReleases)
      .set({
        withdrawnAt: new Date(),
        withdrawnBy: actorId,
        withdrawalReason: reason,
      })
      .where(
        and(
          eq(boffmediaReleases.id, id),
          eq(boffmediaReleases.status, 'published'),
        ),
      );
    return this.findById(id);
  }

  async archive(id: number): Promise<BoffMediaRelease | null> {
    return this.db.transaction(async (tx) => {
      const now = new Date();
      const result = await tx
        .update(boffmediaReleases)
        .set({ status: 'archived' })
        .where(
          and(
            eq(boffmediaReleases.id, id),
            eq(boffmediaReleases.status, 'draft'),
          ),
        );
      if (result[0].affectedRows === 0) return null;

      await tx
        .update(boffmediaReleaseFragments)
        .set({ state: 'released', releasedAt: now })
        .where(
          and(
            eq(boffmediaReleaseFragments.releaseId, id),
            eq(boffmediaReleaseFragments.state, 'claimed'),
          ),
        );

      const [row] = await tx
        .select()
        .from(boffmediaReleases)
        .where(eq(boffmediaReleases.id, id))
        .limit(1);
      return row ?? null;
    });
  }

  async readiness(release: BoffMediaRelease) {
    const verified = await this.verifiedSurfaces(release.id);
    const missing = release.requiredSurfaces.filter(
      (surface) => !verified.has(surface),
    );
    return {
      releaseId: release.id,
      version: release.version,
      requiredSurfaces: release.requiredSurfaces,
      verifiedSurfaces: [...verified],
      missingSurfaces: missing,
      eligible:
        Boolean(release.approvedAt) &&
        isStableReleaseVersion(release.version) &&
        missing.length === 0,
    };
  }

  async claimFragment(input: {
    releaseId: number;
    fragmentId: string;
    sourcePath: string;
    contentHash: string;
    sourceCommitSha: string;
  }) {
    await this.db.insert(boffmediaReleaseFragments).values(input);
  }
}
