import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  mhwildsAnatomyOverrides,
  type MhwildsAnatomyCallouts,
} from '@/_db/schema/Mhwilds';
import type {
  AnatomyCalloutDto,
  SaveAnatomyOverrideDto,
} from '../dto/anatomy-overrides.dto';
import type {
  AnatomyCalloutEntity,
  AnatomyOverrideEntity,
} from '../entities/anatomy-overrides.entity';

@Injectable()
export class MhwildsAnatomyService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async list(): Promise<AnatomyOverrideEntity[]> {
    const rows = await this.db
      .select()
      .from(mhwildsAnatomyOverrides)
      .orderBy(asc(mhwildsAnatomyOverrides.fixedId));
    return rows.map((row) => this.toEntity(row));
  }

  async save(
    dto: SaveAnatomyOverrideDto,
    updatedBy: number,
  ): Promise<AnatomyOverrideEntity> {
    const callouts = this.toCalloutMap(dto.callouts);
    await this.db
      .insert(mhwildsAnatomyOverrides)
      .values({
        fixedId: dto.fixedId,
        variantId: dto.variantId,
        callouts,
        updatedBy,
      })
      .onDuplicateKeyUpdate({
        set: {
          callouts,
          updatedBy,
          updatedAt: new Date(),
        },
      });

    const row = await this.db
      .select()
      .from(mhwildsAnatomyOverrides)
      .where(
        and(
          eq(mhwildsAnatomyOverrides.fixedId, dto.fixedId),
          eq(mhwildsAnatomyOverrides.variantId, dto.variantId),
        ),
      )
      .limit(1);
    if (!row[0]) throw new Error('Anatomy override was not persisted');
    return this.toEntity(row[0]);
  }

  async remove(
    fixedId: number,
    variantId: string,
  ): Promise<{ deleted: boolean }> {
    const result = await this.db
      .delete(mhwildsAnatomyOverrides)
      .where(
        and(
          eq(mhwildsAnatomyOverrides.fixedId, fixedId),
          eq(mhwildsAnatomyOverrides.variantId, variantId),
        ),
      );
    return { deleted: Number(result[0]?.affectedRows ?? 0) > 0 };
  }

  private toCalloutMap(callouts: AnatomyCalloutDto[]): MhwildsAnatomyCallouts {
    return Object.fromEntries(
      callouts.map((callout) => [
        callout.slotKey,
        { x: callout.target.x, y: callout.target.y },
      ]),
    );
  }

  private toEntity(
    row: typeof mhwildsAnatomyOverrides.$inferSelect,
  ): AnatomyOverrideEntity {
    const callouts: AnatomyCalloutEntity[] = Object.entries(
      row.callouts as MhwildsAnatomyCallouts,
    ).map(([slotKey, target]) => ({ slotKey, target }));
    return {
      fixedId: row.fixedId,
      variantId: row.variantId,
      callouts,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
