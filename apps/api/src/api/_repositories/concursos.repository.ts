import { Inject, Injectable } from '@nestjs/common';
import { and, eq, lt, sql, getTableColumns } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { concursosSalas } from '@/_db/schema/Concursos';
import type { ConcursosRoomSnapshotV1 } from '@api/boffmedia/concursos/concursos-room-snapshot-v1';
import { validateSnapshot } from '@api/boffmedia/concursos/concursos-snapshot-validation';
export interface StoredConcursosRoom {
  id: string;
  code: string;
  hostHash: string;
  status: 'lobby' | 'playing' | 'closed';
  revision: bigint;
  snapshotVersion: number;
  snapshot: ConcursosRoomSnapshotV1;
  expiresAt: Date;
  deletedAt: Date | null;
}
export const CONCURSOS_TABLE = Symbol('CONCURSOS_TABLE');
export const CONCURSOS_STORE = Symbol('CONCURSOS_STORE');
export interface ConcursosStore {
  list(): Promise<StoredConcursosRoom[]>;
  find(id: string): Promise<StoredConcursosRoom | undefined>;
  findHost(hash: string): Promise<StoredConcursosRoom | undefined>;
  insert(room: StoredConcursosRoom): Promise<void>;
  replace(room: StoredConcursosRoom, expected: bigint): Promise<void>;
  prune(before: Date): Promise<void>;
}
/** SQL ownership stays here. No upsert: an old write cannot resurrect a deleted UUID. */
@Injectable()
export class ConcursosRepository implements ConcursosStore {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database,
    @Inject(CONCURSOS_TABLE)
    private readonly table: typeof concursosSalas = concursosSalas,
  ) {}
  private columns() {
    // mysql2's shared pool may decode BIGINT as an imprecise Number. Cast this
    // concurrency token to text locally rather than changing every domain's pool.
    return {
      ...getTableColumns(this.table),
      revision: sql<string>`cast(${this.table.revision} as char)`,
    };
  }
  private decode(
    value: Omit<typeof concursosSalas.$inferSelect, 'revision'> & {
      revision: string;
    },
  ): StoredConcursosRoom {
    if (!/^[1-9][0-9]*$/.test(value.revision))
      throw new Error('Invalid Concursos revision');
    const row = { ...value, revision: BigInt(value.revision) };
    if (row.snapshotVersion !== 1 || row.revision < 1n)
      throw new Error('Unsupported Concursos storage version');
    if (
      !/^[ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(row.code) ||
      !/^[a-f0-9]{64}$/.test(row.hostHash) ||
      (row.status === 'closed') !== (row.deletedAt !== null)
    )
      throw new Error('Invalid Concursos room metadata');
    const snapshot = validateSnapshot(
      typeof row.snapshot === 'string'
        ? JSON.parse(row.snapshot)
        : row.snapshot,
    );
    const expiry = Math.min(
      snapshot.createdAtMs + 4 * 60 * 60000,
      (snapshot.hostLostAtMs ?? snapshot.hostSeenAtMs) +
        snapshot.config.recovery.hostRetentionMinutes * 60000,
    );
    if (
      (row.status !== 'closed' &&
        row.status !== (snapshot.game ? 'playing' : 'lobby')) ||
      row.expiresAt.getTime() !== expiry ||
      snapshot.members.some((m) => m.capabilityHash === row.hostHash) ||
      snapshot.revokedCapabilityHashes.includes(row.hostHash) ||
      snapshot.appliedOperations.some(
        (o) => BigInt(o.appliedRevision) > row.revision,
      )
    )
      throw new Error('Inconsistent Concursos metadata and snapshot');
    return { ...row, snapshot };
  }
  async list() {
    return (await this.db.select(this.columns()).from(this.table)).map((r) =>
      this.decode(r),
    );
  }
  async find(id: string) {
    const [r] = await this.db
      .select(this.columns())
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    return r ? this.decode(r) : undefined;
  }
  async findHost(hash: string) {
    const [r] = await this.db
      .select(this.columns())
      .from(this.table)
      .where(eq(this.table.activeHostHash, hash))
      .limit(1);
    return r ? this.decode(r) : undefined;
  }
  async insert(room: StoredConcursosRoom) {
    validateSnapshot(room.snapshot);
    await this.db.insert(this.table).values(room);
  }
  async replace(room: StoredConcursosRoom, expected: bigint) {
    validateSnapshot(room.snapshot);
    const { id, ...values } = room;
    const [result] = await this.db
      .update(this.table)
      .set(values)
      .where(and(eq(this.table.id, id), eq(this.table.revision, expected)));
    if (result.affectedRows !== 1)
      throw new Error('Concursos storage revision conflict');
  }
  async prune(before: Date) {
    await this.db
      .delete(this.table)
      .where(
        and(eq(this.table.status, 'closed'), lt(this.table.deletedAt, before)),
      );
  }
}
