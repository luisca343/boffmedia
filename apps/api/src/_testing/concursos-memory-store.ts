import type {
  ConcursosStore,
  StoredConcursosRoom,
} from '@repositories/concursos.repository';
import { validateSnapshot } from '@api/boffmedia/concursos/concursos-snapshot-validation';
/** Explicit unit/transport fixture. Production never falls back to memory. */
export class ConcursosMemoryStore implements ConcursosStore {
  readonly rows = new Map<string, StoredConcursosRoom>();
  fail = false;
  failAfterCommit = false;
  beforeWrite?: () => Promise<void>;
  private check() {
    if (this.fail) throw new Error('simulated storage outage');
  }
  async list() {
    this.check();
    return structuredClone([...this.rows.values()]);
  }
  async find(id: string) {
    this.check();
    return structuredClone(this.rows.get(id));
  }
  async findHost(hash: string) {
    this.check();
    return structuredClone(
      [...this.rows.values()].find(
        (r) => r.hostHash === hash && r.status !== 'closed',
      ),
    );
  }
  async insert(room: StoredConcursosRoom) {
    this.check();
    await this.beforeWrite?.();
    validateSnapshot(room.snapshot);
    if (
      [...this.rows.values()].some(
        (r) =>
          r.code === room.code ||
          (r.hostHash === room.hostHash && r.status !== 'closed'),
      )
    )
      throw new Error('duplicate room');
    this.rows.set(room.id, structuredClone(room));
    if (this.failAfterCommit)
      throw new Error('simulated lost commit acknowledgement');
  }
  async replace(room: StoredConcursosRoom, expected: bigint) {
    this.check();
    await this.beforeWrite?.();
    validateSnapshot(room.snapshot);
    if (this.rows.get(room.id)?.revision !== expected)
      throw new Error('revision conflict');
    this.rows.set(room.id, structuredClone(room));
    if (this.failAfterCommit)
      throw new Error('simulated lost commit acknowledgement');
  }
  async prune(before: Date) {
    this.check();
    for (const [id, row] of this.rows)
      if (row.status === 'closed' && row.deletedAt && row.deletedAt < before)
        this.rows.delete(id);
  }
}
