import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { Subject } from 'rxjs';
import {
  CONCURSOS_STORE,
  type ConcursosStore,
  type StoredConcursosRoom,
} from '@repositories/concursos.repository';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import { ConcursosRoomsService } from './concursos-rooms.service';
import { gameConflict } from './concursos-game';
import type {
  ConcursosRecoverySettingsDto,
  ConcursosConfigurationDto,
  StartConcursosGameDto,
  ConcursosActionDto,
} from './concursos.dto';

const CHECKPOINT_MS = 1000;
const DB_TIMEOUT_MS = 3000;
const RECEIPTS = 256;
function digest(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ':' + canonical(v))
        .join(',') +
      '}'
    );
  return JSON.stringify(value) ?? 'null';
}
/** A single-instance room writer: candidate -> conditional SQL commit -> visible state.
 * Heartbeats only touch ephemeral presence. Reads never tick, score or acknowledge a candidate. */
@Injectable()
export class ConcursosPersistenceService
  implements OnModuleInit, OnModuleDestroy
{
  readonly changed = new Subject<string>();
  private readonly logger = new Logger(ConcursosPersistenceService.name);
  private readonly records = new Map<string, StoredConcursosRoom>();
  private readonly queues = new Map<string, Promise<unknown>>();
  private readonly unavailable = new Set<string>();
  private readonly recoveryAfter = new Map<string, number>();
  private ready = false;
  private loading = false;
  private stopped = false;
  private timer?: ReturnType<typeof setInterval>;
  private lastPrune = 0;
  constructor(
    private readonly rooms: ConcursosRoomsService,
    @Inject(CONCURSOS_STORE) private readonly store: ConcursosStore,
  ) {
    rooms.durable = true;
  }
  async onModuleInit() {
    await this.load();
    this.timer = setInterval(() => {
      void this.maintain();
    }, 100);
    this.timer.unref();
  }
  onModuleDestroy() {
    this.stopped = true;
    clearInterval(this.timer);
    this.changed.complete();
  }
  private failure(): never {
    throw new ServiceUnavailableException(
      userError(ApiErrorCode.CONCURSOS_STORAGE, 'contest storage unavailable'),
    );
  }
  private async bounded<T>(operation: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Concursos storage timeout')),
            DB_TIMEOUT_MS,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  private async load() {
    if (this.loading || this.stopped) return;
    this.loading = true;
    try {
      const rows = await this.bounded(this.store.list());
      const next = new ConcursosRoomsService();
      next.durable = true;
      const stored = new Map<string, StoredConcursosRoom>();
      const now = Date.now();
      for (const row of rows) {
        if (row.status === 'closed') {
          if (row.deletedAt && now - row.deletedAt.getTime() < 60000) {
            next.load(
              row.code,
              row.hostHash,
              row.snapshot,
              row.deletedAt.getTime(),
            );
            stored.set(row.code, row);
          }
          continue;
        }
        next.load(row.code, row.hostHash, row.snapshot);
        if (now >= row.expiresAt.getTime()) next.expire(row.code, now);
        else
          next.freeze(
            row.code,
            row.snapshot.checkpointAtMs,
            'api_restarted',
            true,
          );
        next.maintain(row.code, now);
        const replacement = this.record(next, row.code, row);
        await this.bounded(this.store.replace(replacement, row.revision));
        stored.set(row.code, replacement);
      }
      for (const code of this.rooms.codes()) this.rooms.forget(code);
      this.records.clear();
      this.unavailable.clear();
      for (const [code, row] of stored) {
        this.rooms.adopt(code, next.fork(code));
        this.records.set(code, row);
        this.changed.next(code);
      }
      this.ready = true;
    } catch {
      this.ready = false;
      // No SQL errors or snapshots: logs must not disclose connection credentials or solutions.
      this.logger.warn(
        'Concursos storage is unavailable or incompatible; room creation remains blocked',
      );
    } finally {
      this.loading = false;
    }
  }
  private record(
    candidate: ConcursosRoomsService,
    code: string,
    prior?: StoredConcursosRoom,
  ): StoredConcursosRoom {
    const snapshot = candidate.snapshot(code);
    snapshot.appliedOperations = prior?.snapshot.appliedOperations ?? [];
    return {
      id: prior?.id ?? randomUUID(),
      ...candidate.metadata(code),
      snapshotVersion: 1,
      revision: (prior?.revision ?? 0n) + 1n,
      snapshot,
    };
  }
  private enqueue<T>(key: string, work: () => Promise<T>): Promise<T> {
    const prior = this.queues.get(key) ?? Promise.resolve();
    const result = prior.catch(() => undefined).then(work);
    this.queues.set(key, result);
    void result
      .finally(() => {
        if (this.queues.get(key) === result) this.queues.delete(key);
      })
      .catch(() => undefined);
    return result;
  }
  private guard(code?: string) {
    if (!this.ready || (code && this.unavailable.has(code))) this.failure();
  }
  private lost(code: string) {
    this.unavailable.add(code);
    this.recoveryAfter.set(code, Date.now() + CHECKPOINT_MS);
    // Discard all speculative effects. Freeze the last confirmed snapshot, retaining live presence.
    const row = this.records.get(code);
    if (row) {
      const candidate = this.rooms.fork(code);
      candidate.load(
        code,
        row.hostHash,
        row.snapshot,
        row.deletedAt?.getTime(),
      );
      candidate.freeze(
        code,
        row.snapshot.checkpointAtMs,
        'storage_unavailable',
      );
      this.rooms.adopt(code, candidate);
      this.changed.next(code);
    }
  }
  private async recover(code: string) {
    this.recoveryAfter.set(code, Date.now() + CHECKPOINT_MS);
    const previous = this.records.get(code);
    if (!previous) return;
    try {
      // Resolve an uncertain commit before accepting any further operation.
      const row = await this.bounded(this.store.find(previous.id));
      if (!row) {
        this.rooms.forget(code);
        this.records.delete(code);
        this.unavailable.delete(code);
        this.changed.next(code);
        return;
      }
      const candidate = this.rooms.fork(code);
      candidate.load(
        code,
        row.hostHash,
        row.snapshot,
        row.deletedAt?.getTime(),
      );
      candidate.freeze(
        code,
        row.snapshot.checkpointAtMs,
        'storage_unavailable',
      );
      // Merge live heartbeats before deciding retention; DB failure alone is not host loss.
      const live = this.rooms.fork(code);
      live.adopt(code, candidate);
      const restored = live.fork(code);
      if (
        row.status !== 'closed' &&
        Date.now() >= restored.metadata(code).expiresAt.getTime()
      )
        restored.expire(code, Date.now());
      const replacement = this.record(restored, code, row);
      await this.bounded(this.store.replace(replacement, row.revision));
      this.records.set(code, replacement);
      this.rooms.adopt(code, restored);
      this.unavailable.delete(code);
      this.changed.next(code);
    } catch {
      /* Remain paused; retry at the next checkpoint, never replay failed commands. */
    }
  }
  private async maintain() {
    if (this.stopped) return;
    if (!this.ready) {
      if (!this.loading && Date.now() - this.lastPrune >= CHECKPOINT_MS) {
        this.lastPrune = Date.now();
        await this.load();
      }
      return;
    }
    for (const code of this.rooms.codes()) {
      if (this.queues.has(code)) continue;
      const row = this.records.get(code);
      if (!row) continue;
      if (
        this.unavailable.has(code) &&
        Date.now() < (this.recoveryAfter.get(code) ?? 0)
      )
        continue;
      void this.enqueue(code, async () => {
        if (this.unavailable.has(code)) {
          await this.recover(code);
          return;
        }
        const current = this.records.get(code);
        if (!current) return;
        if (
          current.status === 'closed' &&
          Date.now() - (current.deletedAt?.getTime() ?? Date.now()) >= 60000
        ) {
          this.rooms.forget(code);
          this.records.delete(code);
          this.changed.next(code);
          return;
        }
        const candidate = this.rooms.fork(code);
        candidate.maintain(code, Date.now());
        const next = this.record(candidate, code, current);
        // Clock movement itself needs one checkpoint/sec; game transitions are immediate.
        const changed =
          JSON.stringify(next.snapshot.game) !==
            JSON.stringify(current.snapshot.game) ||
          next.status !== current.status ||
          JSON.stringify(next.snapshot.recoveries) !==
            JSON.stringify(current.snapshot.recoveries);
        if (
          !changed &&
          Date.now() - current.snapshot.checkpointAtMs < CHECKPOINT_MS
        )
          return;
        try {
          await this.bounded(this.store.replace(next, current.revision));
          this.records.set(code, next);
          this.rooms.adopt(code, candidate);
          this.changed.next(code);
        } catch {
          this.lost(code);
        }
      }).catch(() => this.lost(code));
    }
    if (Date.now() - this.lastPrune > 60000) {
      this.lastPrune = Date.now();
      void this.bounded(this.store.prune(new Date(Date.now() - 60000))).catch(
        () => undefined,
      );
    }
  }
  private run<T>(
    code: string,
    token: string | null,
    name: string,
    body: unknown,
    call: (candidate: ConcursosRoomsService) => T,
    operationId?: string,
  ): Promise<T> {
    return this.enqueue(code, async () => {
      this.guard(code);
      const previous = this.records.get(code);
      if (!previous) {
        this.watch(code, token, false); // Preserve the domain's access/not-found response.
        this.failure();
      }
      // Authenticate even when a persisted operation is replayed; revoked capabilities stay revoked.
      if (name !== 'join' && name !== 'recovery-request')
        this.watch(code, token, false);
      const actorHash = digest(token ?? '');
      const commandHash = digest(canonical({ name, body }));
      const receipt =
        operationId &&
        previous.snapshot.appliedOperations.find(
          (o) => o.actorHash === actorHash && o.operationId === operationId,
        );
      if (receipt) {
        if (receipt.commandHash !== commandHash) gameConflict();
        const view = this.watch(code, token, false);
        return (name === 'recovery-cancel' ? view.recovery : view.data) as T;
      }
      const candidate = this.rooms.fork(code);
      candidate.maintain(code, Date.now());
      const result = call(candidate);
      const next = this.record(candidate, code, previous);
      if (operationId) {
        if (operationId.length > 64 || !operationId.length) gameConflict();
        next.snapshot.appliedOperations = [
          ...next.snapshot.appliedOperations,
          {
            actorHash,
            operationId,
            commandHash,
            appliedRevision: next.revision.toString(),
          },
        ].slice(-RECEIPTS);
      }
      try {
        await this.bounded(this.store.replace(next, previous.revision));
      } catch {
        this.lost(code);
        this.failure();
      }
      this.records.set(code, next);
      this.rooms.adopt(code, candidate);
      this.changed.next(code);
      return result;
    });
  }
  create(
    token: string | null,
    source: string,
    settings?: ConcursosRecoverySettingsDto,
  ) {
    return this.enqueue('$create', async () => {
      this.guard();
      const existing = this.rooms.hostCode(token);
      if (existing)
        return this.run(existing, token, 'create', settings, (c) => {
          if (c.metadata(existing).status === 'closed') gameConflict();
          return c.create(token, source, settings);
        });
      const candidate = this.rooms.fork();
      const view = candidate.create(token, source, settings);
      const next = this.record(candidate, view.code);
      try {
        // Also catches a committed creation whose ACK was lost before a process failure.
        const existingRow = await this.bounded(
          this.store.findHost(next.hostHash),
        );
        if (existingRow) {
          this.ready = false;
          await this.load();
          this.guard();
          return this.restoreHost(token);
        }
        await this.bounded(this.store.insert(next));
      } catch {
        this.ready = false;
        this.failure();
      }
      this.records.set(view.code, next);
      this.rooms.adopt(view.code, candidate);
      this.changed.next(view.code);
      return view;
    });
  }
  watch(code: string, token: string | null, touch = true) {
    if (!this.ready) this.failure();
    const view = this.rooms.passiveCall(() =>
      this.rooms.watch(code, token, touch),
    );
    if (view.data)
      view.data.storageStatus = this.unavailable.has(code)
        ? 'unavailable'
        : 'ready';
    return view;
  }
  read(code: string, token: string | null) {
    return (
      this.watch(code, token).data ??
      this.rooms.passiveCall(() => this.rooms.read(code, token))
    );
  }
  restoreHost(token: string | null) {
    this.guard();
    const result = this.rooms.passiveCall(() => this.rooms.restoreHost(token));
    result.storageStatus = this.unavailable.has(result.code)
      ? 'unavailable'
      : 'ready';
    return result;
  }
  socketOpened(code: string, token: string, connection: symbol) {
    this.rooms.passiveCall(() =>
      this.rooms.socketOpened(code, token, connection),
    );
    this.changed.next(code);
  }
  socketClosed(code: string, token: string, connection: symbol) {
    this.rooms.socketClosed(code, token, connection);
    this.changed.next(code);
  }
  join(code: string, token: string | null, nickname: string) {
    return this.run(code, token, 'join', { nickname }, (c) =>
      c.join(code, token, nickname),
    );
  }
  configure(
    code: string,
    token: string | null,
    body: ConcursosConfigurationDto,
    id?: string,
  ) {
    return this.run(
      code,
      token,
      'configuration',
      body,
      (c) => c.configure(code, token, body),
      id,
    );
  }
  group(code: string, token: string | null, entityId: string, id?: string) {
    return this.run(
      code,
      token,
      'group',
      { entityId },
      (c) => c.group(code, token, entityId),
      id,
    );
  }
  startGame(
    code: string,
    token: string | null,
    body: StartConcursosGameDto,
    id?: string,
  ) {
    return this.run(
      code,
      token,
      'start',
      body,
      (c) => c.startGame(code, token, body),
      id,
    );
  }
  action(
    code: string,
    token: string | null,
    body: ConcursosActionDto,
    id?: string,
  ) {
    return this.run(
      code,
      token,
      'action',
      body,
      (c) => c.action(code, token, body),
      id,
    );
  }
  close(code: string, token: string | null, id?: string) {
    return this.run(code, token, 'close', {}, (c) => c.close(code, token), id);
  }
  leave(code: string, token: string | null, id?: string) {
    return this.run(code, token, 'leave', {}, (c) => c.leave(code, token), id);
  }
  requestDeviceRecovery(
    code: string,
    token: string | null,
    nickname: string,
    source: string,
  ) {
    return this.run(code, token, 'recovery-request', { nickname }, (c) =>
      c.requestDeviceRecovery(code, token, nickname, source),
    );
  }
  decideDeviceRecovery(
    code: string,
    token: string | null,
    requestId: string,
    approve: boolean,
    id?: string,
  ) {
    return this.run(
      code,
      token,
      'recovery-decision',
      { requestId, approve },
      (c) => c.decideDeviceRecovery(code, token, requestId, approve),
      id,
    );
  }
  cancelDeviceRecovery(
    code: string,
    token: string | null,
    requestId: string,
    id?: string,
  ) {
    return this.run(
      code,
      token,
      'recovery-cancel',
      { requestId },
      (c) => c.cancelDeviceRecovery(code, token, requestId),
      id,
    );
  }
}
