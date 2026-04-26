import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { vgcSmogonSnapshots, VgcSmogonSnapshot } from '@/_db/schema/Vgc';

@Injectable()
export class SmogonRepository {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>) {}

  async findSnapshot(formatId: string, month: string, cutoff: number): Promise<VgcSmogonSnapshot | null> {
    const [row] = await this.db
      .select()
      .from(vgcSmogonSnapshots)
      .where(and(
        eq(vgcSmogonSnapshots.formatId, formatId),
        eq(vgcSmogonSnapshots.month, month),
        eq(vgcSmogonSnapshots.cutoff, cutoff),
      ))
      .limit(1);
    return row ?? null;
  }

  async upsertSnapshot(data: { formatId: string; month: string; cutoff: number; data: object }): Promise<void> {
    const serialized = JSON.stringify(data.data);
    const now = new Date();
    await this.db
      .insert(vgcSmogonSnapshots)
      .values({ ...data, data: serialized, fetchedAt: now })
      .onDuplicateKeyUpdate({ set: { data: serialized, fetchedAt: now } });
  }
}
