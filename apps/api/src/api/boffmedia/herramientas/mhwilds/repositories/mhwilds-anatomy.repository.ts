import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  mhwildsAnatomyOverrides,
  type MhwildsAnatomyCallouts,
} from '@/_db/schema/Mhwilds';

export type MhwildsAnatomyOverrideRow =
  typeof mhwildsAnatomyOverrides.$inferSelect;

@Injectable()
export class MhwildsAnatomyRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async list(): Promise<MhwildsAnatomyOverrideRow[]> {
    return this.db
      .select()
      .from(mhwildsAnatomyOverrides)
      .orderBy(asc(mhwildsAnatomyOverrides.fixedId));
  }

  async save(
    fixedId: number,
    variantId: string,
    callouts: MhwildsAnatomyCallouts,
    updatedBy: number,
  ): Promise<MhwildsAnatomyOverrideRow | undefined> {
    await this.db
      .insert(mhwildsAnatomyOverrides)
      .values({ fixedId, variantId, callouts, updatedBy })
      .onDuplicateKeyUpdate({
        set: {
          callouts,
          updatedBy,
          updatedAt: new Date(),
        },
      });

    const rows = await this.db
      .select()
      .from(mhwildsAnatomyOverrides)
      .where(
        and(
          eq(mhwildsAnatomyOverrides.fixedId, fixedId),
          eq(mhwildsAnatomyOverrides.variantId, variantId),
        ),
      )
      .limit(1);

    return rows[0];
  }

  async remove(fixedId: number, variantId: string): Promise<boolean> {
    const result = await this.db
      .delete(mhwildsAnatomyOverrides)
      .where(
        and(
          eq(mhwildsAnatomyOverrides.fixedId, fixedId),
          eq(mhwildsAnatomyOverrides.variantId, variantId),
        ),
      );

    return Number(result[0]?.affectedRows ?? 0) > 0;
  }
}
