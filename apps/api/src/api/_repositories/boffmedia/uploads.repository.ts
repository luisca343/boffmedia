import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaUploads, BoffMediaUpload } from '@/_db/schema/BoffMediaUploads';

/**
 * Track which Boffmedia user uploaded which file. Files written before this table
 * exists have no row and are treated as legacy — admin-only access per the schema
 * comment.
 *
 * `subdir` is always validated by the service and stored as-is; `filename` is
 * already sanitised by multer's storage engine. The unique index on
 * (subdir, filename) enforces that a re-upload to the same location will
 * conflict at the DB level rather than silently inheriting the old owner.
 */
@Injectable()
export class UploadsRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * Record a newly uploaded file and its owner.
   *
   * Throws on a duplicate (subdir, filename) pair — the caller must check
   * whether a file already exists on disk and handle it before calling this.
   */
  async registerUpload(
    ownerUserId: number,
    subdir: string,
    filename: string,
    mimetype: string,
    size: number,
  ): Promise<BoffMediaUpload> {
    const rows = await this.db
      .insert(boffMediaUploads)
      .values({
        ownerUserId,
        subdir,
        filename,
        mimetype,
        size,
      })
      .$returningId();

    return this.findById(rows[0].id);
  }

  /**
   * Look up an upload by its location.
   *
   * Returns `null` when the file exists on disk but has no row (legacy file
   * pre-dating this table), so the service can apply the legacy policy: admin-only.
   */
  async findByLocation(subdir: string, filename: string): Promise<BoffMediaUpload | null> {
    const result = await this.db
      .select()
      .from(boffMediaUploads)
      .where(
        and(
          eq(boffMediaUploads.subdir, subdir),
          eq(boffMediaUploads.filename, filename),
          isNull(boffMediaUploads.deletedAt),
        ),
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Mark an upload as deleted. The row outlives the bytes so a later re-upload
   * cannot silently inherit the old owner, and an orphan sweep can distinguish
   * "deleted on purpose" from "never registered".
   */
  async markDeleted(id: number): Promise<void> {
    await this.db
      .update(boffMediaUploads)
      .set({ deletedAt: new Date() })
      .where(eq(boffMediaUploads.id, id));
  }

  /**
   * Fetch an upload by id.
   */
  private async findById(id: number): Promise<BoffMediaUpload> {
    const result = await this.db
      .select()
      .from(boffMediaUploads)
      .where(eq(boffMediaUploads.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new Error(`Upload not found: ${id}`);
    }
    return result[0];
  }
}
