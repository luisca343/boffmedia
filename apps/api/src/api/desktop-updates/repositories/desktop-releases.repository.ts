import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  DesktopRelease,
  NewDesktopRelease,
  desktopReleases,
} from '@/_db/schema/DesktopReleases';

@Injectable()
export class DesktopReleasesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: MySql2Database) {}

  async findById(id: number): Promise<DesktopRelease | null> {
    const [row] = await this.db
      .select()
      .from(desktopReleases)
      .where(eq(desktopReleases.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByVersionTarget(
    version: string,
    target: string,
  ): Promise<DesktopRelease | null> {
    const [row] = await this.db
      .select()
      .from(desktopReleases)
      .where(
        and(
          eq(desktopReleases.version, version),
          eq(desktopReleases.target, target),
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
  async listPublishedForTarget(target: string): Promise<DesktopRelease[]> {
    return this.db
      .select()
      .from(desktopReleases)
      .where(
        and(
          eq(desktopReleases.target, target),
          eq(desktopReleases.published, true),
        ),
      )
      .orderBy(desc(desktopReleases.publishedAt));
  }

  /** Every published row, all targets. Same caveat as above: the ordering is a
   *  tiebreaker, not the semver answer. */
  async listPublished(): Promise<DesktopRelease[]> {
    return this.db
      .select()
      .from(desktopReleases)
      .where(eq(desktopReleases.published, true))
      .orderBy(desc(desktopReleases.publishedAt));
  }

  async listAll(): Promise<DesktopRelease[]> {
    return this.db
      .select()
      .from(desktopReleases)
      .orderBy(desc(desktopReleases.createdAt));
  }

  /** Idempotent by (version, target): a re-upload replaces the artifact row so
   *  the unique index never has to reject a legitimate retry. */
  async upsert(row: NewDesktopRelease): Promise<void> {
    await this.db
      .insert(desktopReleases)
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
      .update(desktopReleases)
      .set({ published, publishedAt: published ? new Date() : null })
      .where(eq(desktopReleases.id, id));
  }

  async remove(id: number): Promise<void> {
    await this.db.delete(desktopReleases).where(eq(desktopReleases.id, id));
  }
}
