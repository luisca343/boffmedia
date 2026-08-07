import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  LauncherRelease,
  NewLauncherRelease,
  launcherReleases,
} from '@/_db/schema/LauncherReleases';

@Injectable()
export class LauncherReleasesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: MySql2Database) {}

  async findById(id: number): Promise<LauncherRelease | null> {
    const [row] = await this.db
      .select()
      .from(launcherReleases)
      .where(eq(launcherReleases.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByVersionTarget(
    version: string,
    target: string,
  ): Promise<LauncherRelease | null> {
    const [row] = await this.db
      .select()
      .from(launcherReleases)
      .where(
        and(
          eq(launcherReleases.version, version),
          eq(launcherReleases.target, target),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  /**
   * Every published row for a target. Ordered by publish time only as a
   * tiebreaker — "which is newest" is a semver question the service answers,
   * because `10.0.0` sorts before `9.0.0` as a string and MySQL cannot help.
   */
  async listPublishedForTarget(target: string): Promise<LauncherRelease[]> {
    return this.db
      .select()
      .from(launcherReleases)
      .where(
        and(
          eq(launcherReleases.target, target),
          eq(launcherReleases.published, true),
        ),
      )
      .orderBy(desc(launcherReleases.publishedAt));
  }

  /** Every published row, all targets. Same caveat as above: the ordering is a
   *  tiebreaker, not the semver answer. */
  async listPublished(): Promise<LauncherRelease[]> {
    return this.db
      .select()
      .from(launcherReleases)
      .where(eq(launcherReleases.published, true))
      .orderBy(desc(launcherReleases.publishedAt));
  }

  async listAll(): Promise<LauncherRelease[]> {
    return this.db
      .select()
      .from(launcherReleases)
      .orderBy(desc(launcherReleases.createdAt));
  }

  /** Idempotent by (version, target): a re-upload replaces the artifact row so
   *  the unique index never has to reject a legitimate retry. */
  async upsert(row: NewLauncherRelease): Promise<void> {
    await this.db
      .insert(launcherReleases)
      .values(row)
      .onDuplicateKeyUpdate({
        set: {
          signature: row.signature,
          notes: row.notes,
          artifactName: row.artifactName,
          artifactSha512: row.artifactSha512,
          sizeBytes: row.sizeBytes,
          uploadedBy: row.uploadedBy,
        },
      });
  }

  async setPublished(id: number, published: boolean): Promise<void> {
    await this.db
      .update(launcherReleases)
      .set({ published, publishedAt: published ? new Date() : null })
      .where(eq(launcherReleases.id, id));
  }

  async remove(id: number): Promise<void> {
    await this.db.delete(launcherReleases).where(eq(launcherReleases.id, id));
  }
}
