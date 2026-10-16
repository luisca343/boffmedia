import { z } from 'zod';
import { recoverySettings } from './concursos-recovery-settings';
import type { ConcursosRoomSnapshotV1 } from './concursos-room-snapshot-v1';
const epoch = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const count = z.number().int().min(0).max(100000000);
// Match class-validator Length: Unicode code points, rather than UTF-16 units.
function text(min: number, max: number) {
  return z.string().refine((value) => {
    const size = Array.from(value).length;
    return size >= min && size <= max;
  });
}
const id = text(1, 160);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const choice = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
const profile = z.strictObject({
  version: z.literal(1),
  hostGraceSeconds: count,
  hostRetentionMinutes: count,
  allowLocalSelectionWhilePaused: z.boolean(),
  hideQuestionWhilePaused: z.boolean(),
  resumeCountdownSeconds: count,
  skipAbsentSelector: z.boolean(),
  absentSelectorSeconds: count,
  autoReplaceCaptain: z.boolean(),
  captainGraceSeconds: count,
  pauseWhenAllDisconnected: z.boolean(),
  allDisconnectedGraceSeconds: count,
  deviceRecoveryMinutes: count,
  allowConnectedDeviceRecovery: z.boolean(),
  allowDeviceRecoveryDuringQuestion: z.boolean(),
});
const game = z.strictObject({
  stage: z.enum(['board', 'question', 'result', 'finished']),
  roundId: count,
  entities: z
    .array(
      z.strictObject({
        id,
        label: text(1, 24),
        memberIds: z.array(id).min(1).max(4),
        score: count,
        captainId: id.nullable(),
        captainRevision: count,
        temporaryCaptain: z.boolean(),
      }),
    )
    .min(2)
    .max(4),
  questions: z
    .array(
      z.strictObject({
        id,
        category: text(1, 100),
        prompt: text(1, 2000),
        choices: z.tuple([
          text(1, 500),
          text(1, 500),
          text(1, 500),
          text(1, 500),
        ]),
        correctIndex: choice,
        seconds: z.number().int().min(1).max(3600),
        points: z.number().int().min(0).max(100000),
        phaseIndex: z.number().int().min(0).max(99),
        phaseTitle: text(1, 200),
      }),
    )
    .min(1)
    .max(100),
  selectorIndex: count,
  usedQuestionIds: z.array(id).max(100),
  currentQuestionId: id.nullable(),
  answers: z.array(z.strictObject({ entityId: id, choice })).max(4),
  proposals: z.array(z.strictObject({ memberId: id, choice })).max(4),
  captainSeats: z
    .array(z.strictObject({ entityId: id, seatIndex: count }))
    .max(4),
  selectionRevision: count,
  controlRevision: count,
  lastControl: z
    .strictObject({
      action: z.enum(['pause', 'resume']),
      revision: count,
      roundId: count,
    })
    .nullable(),
  clock: z.strictObject({
    deadlineAtMs: epoch.nullable(),
    advanceAtMs: epoch.nullable(),
    pausedAtMs: epoch.nullable(),
    resumeAtMs: epoch.nullable(),
    pauseReason: z
      .enum([
        'manual',
        'host_disconnected',
        'players_disconnected',
        'api_restarted',
        'storage_unavailable',
      ])
      .nullable(),
    selectionNotBeforeMs: epoch,
    selectionWaitAtMs: epoch.nullable(),
    selectionSkipAtMs: epoch.nullable(),
  }),
});
const schema = z.strictObject({
  version: z.literal(1),
  createdAtMs: epoch,
  checkpointAtMs: epoch,
  hostSeenAtMs: epoch,
  hostLostAtMs: epoch.nullable(),
  config: z.strictObject({
    mode: z.enum(['individual', 'teams']),
    pacing: z.enum(['automatic', 'directed']),
    resultSeconds: z.number().int().min(3).max(30),
    recovery: profile,
  }),
  members: z
    .array(
      z.strictObject({
        id,
        capabilityHash: hash,
        nickname: text(1, 24),
        groupId: z.enum(['team-1', 'team-2']).nullable(),
        seenAtMs: epoch,
        lostAtMs: epoch.nullable(),
      }),
    )
    .max(4),
  // Intake stops at 128; already pending transfers (at most eight) can still finish.
  revokedCapabilityHashes: z.array(hash).max(136),
  recoveries: z
    .array(
      z.strictObject({
        id,
        applicantHash: hash,
        memberId: id,
        nickname: text(1, 24),
        verificationCode: z.string().regex(/^[0-9]{6}$/),
        status: z.enum([
          'pending',
          'approved',
          'denied',
          'expired',
          'cancelled',
          'superseded',
          'closed',
        ]),
        createdAtMs: epoch,
        expiresAtMs: epoch,
        terminalAtMs: epoch.nullable(),
      }),
    )
    .max(32),
  game: game.nullable(),
  appliedOperations: z
    .array(
      z.strictObject({
        actorHash: hash,
        operationId: z.string().min(1).max(64),
        commandHash: hash,
        appliedRevision: z.string().regex(/^[1-9][0-9]*$/),
      }),
    )
    .max(256),
});
/** Reject the complete private document on any incompatible or invalid state.
 * Errors deliberately omit the snapshot (solutions, capability hashes, recovery proofs). */
export function validateSnapshot(input: unknown): ConcursosRoomSnapshotV1 {
  if (Buffer.byteLength(JSON.stringify(input) ?? '') > 2 * 1024 * 1024)
    throw new Error('Concursos snapshot exceeds limit');
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid Concursos snapshot format');
  const s = parsed.data;
  recoverySettings(s.config.recovery);
  const ensure = (valid: boolean) => {
    if (!valid) throw new Error('Invalid Concursos snapshot invariants');
  };
  const unique = (values: unknown[]) => new Set(values).size === values.length;
  ensure(
    s.createdAtMs <= s.checkpointAtMs && s.hostSeenAtMs <= s.checkpointAtMs,
  );
  ensure(
    unique(s.members.map((m) => m.id)) &&
      unique(s.members.map((m) => m.capabilityHash)) &&
      unique(s.members.map((m) => m.nickname.toLocaleLowerCase())),
  );
  ensure(
    s.members.every(
      (m) => !s.revokedCapabilityHashes.includes(m.capabilityHash),
    ),
  );
  ensure(
    unique(s.recoveries.map((r) => r.id)) &&
      unique(s.recoveries.map((r) => r.applicantHash)),
  );
  ensure(
    s.recoveries.every(
      (r) =>
        r.expiresAtMs > r.createdAtMs &&
        (r.status === 'pending') === (r.terminalAtMs === null),
    ),
  );
  ensure(
    unique(s.appliedOperations.map((r) => r.actorHash + ':' + r.operationId)),
  );
  const g = s.game;
  if (g) {
    const entities = new Map(g.entities.map((e) => [e.id, e]));
    const members = g.entities.flatMap((e) => e.memberIds);
    const questions = new Set(g.questions.map((q) => q.id));
    ensure(
      unique([...g.entities.map((e) => e.id)]) &&
        unique(members) &&
        unique(g.questions.map((q) => q.id)),
    );
    ensure(
      g.selectorIndex < g.entities.length &&
        unique(g.usedQuestionIds) &&
        g.usedQuestionIds.every((q) => questions.has(q)),
    );
    ensure(
      (g.stage === 'question' || g.stage === 'result') ===
        (g.currentQuestionId !== null),
    );
    ensure(
      g.currentQuestionId === null ||
        (questions.has(g.currentQuestionId) &&
          !g.usedQuestionIds.includes(g.currentQuestionId)),
    );
    ensure(g.stage !== 'question' || g.clock.deadlineAtMs !== null);
    ensure((g.clock.pausedAtMs === null) === (g.clock.pauseReason === null));
    ensure(
      g.clock.resumeAtMs === null ||
        (g.clock.pausedAtMs !== null &&
          g.clock.resumeAtMs >= g.clock.pausedAtMs),
    );
    ensure(
      (g.clock.selectionSkipAtMs === null) ===
        (g.clock.selectionWaitAtMs === null),
    );
    ensure(
      unique(g.answers.map((a) => a.entityId)) &&
        g.answers.every((a) => entities.has(a.entityId)),
    );
    ensure(
      unique(g.proposals.map((a) => a.memberId)) &&
        g.proposals.every((a) => members.includes(a.memberId)),
    );
    ensure(
      g.stage === 'finished' ||
        members.every((id) => s.members.some((m) => m.id === id)),
    );
    ensure(
      g.stage === 'finished' || s.members.every((m) => members.includes(m.id)),
    );
    ensure(
      g.entities.every((e) =>
        s.config.mode === 'individual'
          ? e.memberIds.length === 1 && e.captainId === null
          : e.memberIds.includes(e.captainId ?? ''),
      ),
    );
    ensure(unique(g.captainSeats.map((c) => c.entityId)));
    ensure(
      s.config.mode === 'individual'
        ? g.captainSeats.length === 0
        : g.captainSeats.length === g.entities.length &&
            g.captainSeats.every(
              (c) =>
                entities.has(c.entityId) &&
                c.seatIndex < entities.get(c.entityId)!.memberIds.length,
            ),
    );
  }
  if (g) {
    ensure(
      g.roundId ===
        g.usedQuestionIds.length + (g.currentQuestionId === null ? 0 : 1),
    );
    ensure(g.stage !== 'question' || g.answers.length < g.entities.length);
    ensure(
      (g.stage !== 'board' && g.stage !== 'finished') ||
        (g.answers.length === 0 &&
          g.proposals.length === 0 &&
          g.clock.deadlineAtMs === null &&
          g.clock.advanceAtMs === null),
    );
    ensure(
      g.stage !== 'finished' ||
        (g.usedQuestionIds.length === g.questions.length &&
          g.clock.pausedAtMs === null),
    );
    ensure(
      g.stage !== 'result' ||
        (s.config.pacing === 'automatic') === (g.clock.advanceAtMs !== null),
    );
    ensure(
      g.lastControl === null ||
        (g.lastControl.revision < g.controlRevision &&
          g.lastControl.roundId <= g.roundId),
    );
    if (s.config.mode === 'teams' && g.stage !== 'finished')
      ensure(
        g.entities.every((e) =>
          e.memberIds.every(
            (id) => s.members.find((m) => m.id === id)?.groupId === e.id,
          ),
        ),
      );
  }
  return s;
}
