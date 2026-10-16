import type { CategoryGameSnapshotV1 } from './concursos-room-snapshot-v1';
import { ConcursosRecoverySettingsDto } from './concursos.dto';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import type {
  ConcursosActionDto,
  ConcursosEntityDto,
  ConcursosGameDto,
  ConcursosQuestionDto,
} from './concursos.dto';

export function gameConflict(): never {
  throw new ConflictException(
    userError(ApiErrorCode.CONCURSOS_GAME, 'game action unavailable'),
  );
}
/** One scoring entity has one or several members. Individual UI has no captain step.
 * This engine owns deadlines, hidden solutions, commitments and cumulative scores. */
export class ConcursosGame {
  stage: ConcursosGameDto['stage'] = 'board';
  roundId = 0;
  private selector = 0;
  private used = new Set<string>();
  private current?: ConcursosQuestionDto;
  private deadlineAt?: number;
  private advanceAt?: number;
  private pausedAt?: number;
  private resumeAt?: number;
  private pauseReason?: ConcursosGameDto['pauseReason'];
  private absent?: Map<string, number>;
  private selectionNotBefore = 0;
  private selectionWaitAt?: number;
  private selectionSkipAt?: number;
  private selectionRevision = 0;
  private readonly captainSeats = new Map<string, number>();
  private controlRevision = 0;
  private lastControl?: { action: string; revision: number; roundId: number };
  private answers = new Map<string, number>();
  private proposals = new Map<string, number>();
  constructor(
    readonly entities: ConcursosEntityDto[],
    private readonly questions: ConcursosQuestionDto[],
    private readonly mode: 'individual' | 'teams',
    private readonly pacing: 'automatic' | 'directed' = 'automatic',
    private readonly resultSeconds = 8,
    private readonly recovery: ConcursosRecoverySettingsDto = new ConcursosRecoverySettingsDto(),
  ) {
    if (
      entities.length < 2 ||
      entities.some((e) => !e.memberIds.length) ||
      new Set(questions.map((q) => q.id)).size !== questions.length
    )
      gameConflict();
    if (mode === 'teams')
      for (const entity of entities) {
        this.captainSeats.set(
          entity.id,
          Math.max(0, entity.memberIds.indexOf(entity.captainId!)),
        );
        entity.captainRevision = 0;
        entity.temporaryCaptain = false;
      }
  }
  /** Internal durable state. Never send this document to a participant. */
  snapshot(): CategoryGameSnapshotV1 {
    return structuredClone({
      stage: this.stage,
      roundId: this.roundId,
      entities: this.entities.map((e) => ({
        ...e,
        captainId: e.captainId ?? null,
        captainRevision: e.captainRevision ?? 0,
        temporaryCaptain: e.temporaryCaptain ?? false,
      })),
      questions: this.questions.map((q) => ({
        ...q,
        choices: [...q.choices] as [string, string, string, string],
        correctIndex: q.correctIndex as 0 | 1 | 2 | 3,
      })),
      selectorIndex: this.selector,
      usedQuestionIds: [...this.used],
      currentQuestionId: this.current?.id ?? null,
      answers: [...this.answers].map(([entityId, choice]) => ({
        entityId,
        choice: choice as 0 | 1 | 2 | 3,
      })),
      proposals: [...this.proposals].map(([memberId, choice]) => ({
        memberId,
        choice: choice as 0 | 1 | 2 | 3,
      })),
      captainSeats: [...this.captainSeats].map(([entityId, seatIndex]) => ({
        entityId,
        seatIndex,
      })),
      selectionRevision: this.selectionRevision,
      controlRevision: this.controlRevision,
      lastControl: this.lastControl
        ? {
            ...this.lastControl,
            action: this.lastControl.action as 'pause' | 'resume',
          }
        : null,
      clock: {
        deadlineAtMs: this.deadlineAt ?? null,
        advanceAtMs: this.advanceAt ?? null,
        pausedAtMs: this.pausedAt ?? null,
        resumeAtMs: this.resumeAt ?? null,
        pauseReason: this.pauseReason ?? null,
        selectionNotBeforeMs: this.selectionNotBefore,
        selectionWaitAtMs: this.selectionWaitAt ?? null,
        selectionSkipAtMs: this.selectionSkipAt ?? null,
      },
    });
  }
  static restore(
    s: CategoryGameSnapshotV1,
    mode: 'individual' | 'teams',
    pacing: 'automatic' | 'directed',
    seconds: number,
    recovery: ConcursosRecoverySettingsDto,
  ) {
    const entities = s.entities.map((e) => ({
      ...e,
      memberIds: [...e.memberIds],
      captainId: e.captainId ?? undefined,
    }));
    const game = new ConcursosGame(
      entities,
      structuredClone(s.questions),
      mode,
      pacing,
      seconds,
      recovery,
    );
    // Construction initializes normal captains. Restore exceptional roles afterwards.
    entities.forEach((e, i) =>
      Object.assign(e, s.entities[i], {
        captainId: s.entities[i].captainId ?? undefined,
      }),
    );
    game.stage = s.stage;
    game.roundId = s.roundId;
    game.selector = s.selectorIndex;
    game.used = new Set(s.usedQuestionIds);
    game.current = game.questions.find((q) => q.id === s.currentQuestionId);
    game.answers = new Map(s.answers.map((a) => [a.entityId, a.choice]));
    game.proposals = new Map(s.proposals.map((a) => [a.memberId, a.choice]));
    game.captainSeats.clear();
    s.captainSeats.forEach((c) =>
      game.captainSeats.set(c.entityId, c.seatIndex),
    );
    game.selectionRevision = s.selectionRevision;
    game.controlRevision = s.controlRevision;
    game.lastControl = s.lastControl ?? undefined;
    game.deadlineAt = s.clock.deadlineAtMs ?? undefined;
    game.advanceAt = s.clock.advanceAtMs ?? undefined;
    game.pausedAt = s.clock.pausedAtMs ?? undefined;
    game.resumeAt = s.clock.resumeAtMs ?? undefined;
    game.pauseReason = s.clock.pauseReason ?? undefined;
    game.selectionNotBefore = s.clock.selectionNotBeforeMs;
    game.selectionWaitAt = s.clock.selectionWaitAtMs ?? undefined;
    game.selectionSkipAt = s.clock.selectionSkipAtMs ?? undefined;
    return game;
  }
  /** Freeze without ticking/scoring. A restart or failed write cannot consume time. */
  freeze(at: number, reason: 'api_restarted' | 'storage_unavailable') {
    if (this.stage === 'finished') return;
    this.pausedAt ??= at;
    this.resumeAt = undefined;
    this.pauseReason = reason;
    this.controlRevision++;
    this.lastControl = undefined;
  }
  /** Room presence is authoritative. Apply the earliest automatic pause before
   * advancing timers; a delayed sweep must not reveal a paused question. */
  syncPresence(absent: Map<string, number>, now: number, hostPauseAt?: number) {
    this.absent = absent;
    // A return cancels the old absence episode even during a manual pause.
    if (this.stage === 'board' && this.connected(this.entities[this.selector]))
      this.selectionWaitAt = this.selectionSkipAt = undefined;
    const pauses: {
      at: number;
      reason: 'host_disconnected' | 'players_disconnected';
    }[] = [];
    if (hostPauseAt !== undefined)
      pauses.push({ at: hostPauseAt, reason: 'host_disconnected' });
    const ids = this.entities.flatMap((entity) => entity.memberIds);
    if (
      this.recovery.pauseWhenAllDisconnected &&
      ids.every((id) => absent.has(id))
    )
      pauses.push({
        at:
          Math.max(...ids.map((id) => absent.get(id)!)) +
          this.recovery.allDisconnectedGraceSeconds * 1000,
        reason: 'players_disconnected',
      });
    for (const pause of pauses.sort((a, b) => a.at - b.at))
      if (now >= pause.at) this.pauseForLoss(pause.at, pause.reason);
    this.tick(now);
  }
  private connected(entity: ConcursosEntityDto) {
    return entity.memberIds.some((id) => !this.absent?.has(id));
  }
  private updateParticipants(now: number) {
    if (!this.absent || this.stage === 'finished') return;
    if (
      this.mode === 'teams' &&
      this.recovery.autoReplaceCaptain &&
      this.stage !== 'result'
    )
      for (const entity of this.entities) {
        const lostAt = this.absent.get(entity.captainId!);
        if (
          lostAt === undefined ||
          now < lostAt + this.recovery.captainGraceSeconds * 1000
        )
          continue;
        const previous = entity.memberIds.indexOf(entity.captainId!);
        for (let offset = 1; offset < entity.memberIds.length; offset++) {
          const candidate =
            entity.memberIds[(previous + offset) % entity.memberIds.length];
          if (!this.absent.has(candidate)) {
            entity.captainId = candidate;
            entity.captainRevision = (entity.captainRevision ?? 0) + 1;
            entity.temporaryCaptain = true;
            break;
          }
        }
      }
    if (
      this.stage !== 'board' ||
      !this.recovery.skipAbsentSelector ||
      this.connected(this.entities[this.selector])
    ) {
      this.selectionWaitAt = this.selectionSkipAt = undefined;
      return;
    }
    if (this.selectionSkipAt === undefined) {
      const entity = this.entities[this.selector];
      this.selectionWaitAt = Math.max(
        this.selectionNotBefore,
        ...entity.memberIds.map((id) => this.absent!.get(id)!),
      );
      this.selectionSkipAt =
        this.selectionWaitAt + this.recovery.absentSelectorSeconds * 1000;
    }
    if (now < this.selectionSkipAt) return;
    for (let offset = 1; offset < this.entities.length; offset++) {
      const next = (this.selector + offset) % this.entities.length;
      if (this.connected(this.entities[next])) {
        this.selector = next;
        this.selectionRevision++;
        this.selectionWaitAt = this.selectionSkipAt = undefined;
        return;
      }
    }
  }
  private responder(entity: ConcursosEntityDto): string | undefined {
    return this.mode === 'individual' ? entity.memberIds[0] : entity.captainId;
  }
  private available() {
    const remaining = this.questions.filter((q) => !this.used.has(q.id));
    const phase = Math.min(...remaining.map((q) => q.phaseIndex));
    return remaining.filter((q) => q.phaseIndex === phase);
  }
  tick(now = Date.now()) {
    if (this.pausedAt !== undefined) {
      if (this.resumeAt === undefined || now < this.resumeAt) return;
      const shift = this.resumeAt - this.pausedAt;
      if (this.deadlineAt !== undefined) this.deadlineAt += shift;
      if (this.advanceAt !== undefined) this.advanceAt += shift;
      if (this.selectionSkipAt !== undefined)
        this.selectionSkipAt +=
          this.resumeAt - Math.max(this.pausedAt, this.selectionWaitAt!);
      if (this.selectionSkipAt === undefined && this.stage === 'board')
        this.selectionNotBefore = this.resumeAt;
      this.pausedAt = undefined;
      this.resumeAt = undefined;
      this.pauseReason = undefined;
    }
    if (this.stage === 'question' && now >= this.deadlineAt!)
      this.close(this.deadlineAt!);
    if (
      this.stage === 'result' &&
      this.advanceAt !== undefined &&
      now >= this.advanceAt
    )
      this.advance();
    this.updateParticipants(now);
  }
  pauseForHostLoss(at: number) {
    this.pauseForLoss(at, 'host_disconnected');
  }
  private pauseForLoss(
    at: number,
    reason: 'host_disconnected' | 'players_disconnected',
  ) {
    this.tick(at);
    if (this.stage === 'finished') return;
    if (this.pausedAt !== undefined) {
      // A new disconnection also cancels a pending resume countdown.
      if (this.resumeAt !== undefined) {
        this.resumeAt = undefined;
        this.controlRevision++;
        this.lastControl = undefined;
      }
      return;
    }
    this.pausedAt = at;
    this.pauseReason = reason;
    this.controlRevision++;
    this.lastControl = undefined;
  }
  private control(memberId: string | undefined, command: ConcursosActionDto) {
    if (memberId !== undefined)
      throw new ForbiddenException(
        userError(ApiErrorCode.CONCURSOS_ACCESS, 'host required'),
      );
    if (command.roundId !== this.roundId) gameConflict();
    if (
      this.lastControl?.action === command.action &&
      this.lastControl.revision === command.controlRevision &&
      this.lastControl.roundId === command.roundId
    )
      return;
    if (
      command.controlRevision !== this.controlRevision ||
      this.stage === 'finished'
    )
      gameConflict();
    if (command.action === 'pause') {
      if (this.pausedAt !== undefined && this.resumeAt === undefined)
        gameConflict();
      this.pausedAt ??= Date.now();
      this.resumeAt = undefined;
      this.pauseReason = 'manual';
    } else {
      if (this.pausedAt === undefined || this.resumeAt !== undefined)
        gameConflict();
      if (
        this.recovery.pauseWhenAllDisconnected &&
        this.absent &&
        this.entities.every((entity) => !this.connected(entity))
      )
        gameConflict();
      this.resumeAt = Date.now() + this.recovery.resumeCountdownSeconds * 1000;
    }
    this.lastControl = {
      action: command.action,
      revision: this.controlRevision,
      roundId: this.roundId,
    };
    this.controlRevision++;
    this.tick();
  }
  private close(closedAt = Date.now()) {
    if (this.stage !== 'question') return;
    this.stage = 'result';
    this.advanceAt =
      this.pacing === 'automatic'
        ? closedAt + this.resultSeconds * 1000
        : undefined;
    for (const entity of this.entities)
      if (this.answers.get(entity.id) === this.current!.correctIndex)
        entity.score += this.current!.points;
  }
  private advance() {
    if (this.stage !== 'result') return;
    this.used.add(this.current!.id);
    this.current = undefined;
    if (this.mode === 'teams')
      for (const unit of this.entities) {
        const next =
          (this.captainSeats.get(unit.id)! + 1) % unit.memberIds.length;
        this.captainSeats.set(unit.id, next);
        unit.captainId = unit.memberIds[next];
        unit.captainRevision = (unit.captainRevision ?? 0) + 1;
        unit.temporaryCaptain = false;
      }
    this.selector = (this.selector + 1) % this.entities.length;
    this.selectionRevision++;
    this.selectionNotBefore = 0;
    this.selectionWaitAt = this.selectionSkipAt = undefined;
    this.stage = this.available().length ? 'board' : 'finished';
    this.deadlineAt = undefined;
    this.advanceAt = undefined;
    this.answers.clear();
    this.proposals.clear();
  }
  act(memberId: string | undefined, command: ConcursosActionDto) {
    this.tick();
    if (command.action === 'pause' || command.action === 'resume') {
      this.control(memberId, command);
      return;
    }
    if (this.pausedAt !== undefined) gameConflict();
    if (command.action === 'next') {
      if (this.pacing !== 'directed') gameConflict();
      if (memberId !== undefined)
        throw new ForbiddenException(
          userError(ApiErrorCode.CONCURSOS_ACCESS, 'host required'),
        );
      if (command.roundId !== this.roundId) gameConflict();
      // A lost next reply can be retried without skipping a question.
      if (this.stage === 'board' || this.stage === 'finished') return;
      if (this.stage !== 'result') gameConflict();
      this.advance();
      return;
    }
    const entity = this.entities.find((e) =>
      e.memberIds.includes(memberId ?? ''),
    );
    if (!entity)
      throw new ForbiddenException(
        userError(ApiErrorCode.CONCURSOS_ACCESS, 'player required'),
      );
    if (command.action === 'choose' || command.action === 'answer') {
      if (
        this.mode === 'teams' &&
        (command.captainRevision ?? 0) !== (entity.captainRevision ?? 0)
      )
        gameConflict();
    }
    if (command.action === 'choose') {
      if ((command.selectionRevision ?? 0) !== this.selectionRevision)
        gameConflict();
      if (
        this.stage === 'question' &&
        this.current?.id === command.questionId &&
        entity.id === this.entities[this.selector].id &&
        memberId === this.responder(entity)
      )
        return;
      if (
        this.stage !== 'board' ||
        entity.id !== this.entities[this.selector].id ||
        memberId !== this.responder(entity)
      )
        gameConflict();
      const question = this.available().find(
        (q) => q.id === command.questionId,
      );
      if (!question) gameConflict();
      // Rotate at the next question boundary, never while an answer is open.

      this.roundId += 1;
      this.current = question;
      this.answers.clear();
      this.proposals.clear();
      this.deadlineAt = Date.now() + question.seconds * 1000;
      this.stage = 'question';
      return;
    }
    if (
      command.roundId !== this.roundId ||
      !Number.isInteger(command.choice) ||
      command.choice! < 0 ||
      command.choice! > 3
    )
      gameConflict();
    if (
      command.action === 'answer' &&
      this.responder(entity) === memberId &&
      this.answers.get(entity.id) === command.choice &&
      (this.stage === 'question' || this.stage === 'result')
    )
      return;
    if (this.stage !== 'question' || this.answers.has(entity.id))
      gameConflict();
    if (command.action === 'propose') {
      if (this.mode !== 'teams') gameConflict();
      this.proposals.set(memberId!, command.choice!);
    } else {
      if (memberId !== this.responder(entity))
        throw new ForbiddenException(
          userError(ApiErrorCode.CONCURSOS_ACCESS, 'captain required'),
        );
      this.answers.set(entity.id, command.choice!);
      if (this.answers.size === this.entities.length) this.close();
    }
  }
  view(memberId?: string, advance = true): ConcursosGameDto {
    if (advance) this.tick();
    const available = this.available();
    const ownEntity = this.entities.find((e) =>
      e.memberIds.includes(memberId ?? ''),
    );
    const showResult = this.stage === 'result';
    return {
      stage: this.stage,
      selectionRevision: this.selectionRevision,
      ...(this.selectionSkipAt !== undefined && {
        ...(this.pausedAt === undefined
          ? { selectionSkipAt: this.selectionSkipAt }
          : {
              selectionRemainingMs: Math.max(
                0,
                this.selectionSkipAt -
                  Math.max(this.pausedAt, this.selectionWaitAt!),
              ),
            }),
      }),
      paused: this.pausedAt !== undefined,
      controlRevision: this.controlRevision,
      ...(this.pausedAt !== undefined && {
        pauseReason: this.pauseReason,
        ...(this.resumeAt !== undefined && { resumeAt: this.resumeAt }),
        ...(this.stage === 'question' && {
          remainingMs: Math.max(0, this.deadlineAt! - this.pausedAt),
        }),
        ...(this.stage === 'result' &&
          this.advanceAt !== undefined && {
            remainingMs: Math.max(0, this.advanceAt - this.pausedAt),
          }),
      }),
      pacing: this.pacing,
      resultSeconds: this.resultSeconds,
      ...(showResult &&
        this.advanceAt !== undefined && { advanceAt: this.advanceAt }),
      roundId: this.roundId,
      selectorId: this.entities[this.selector].id,
      phaseTitle: this.current?.phaseTitle ?? available[0]?.phaseTitle ?? '',
      board:
        this.stage === 'board' && this.pausedAt === undefined
          ? available.map((q) => ({ id: q.id, category: q.category }))
          : [],
      serverNow: Date.now(),
      ...(this.current &&
        !(
          this.stage === 'question' &&
          this.pausedAt !== undefined &&
          this.recovery.hideQuestionWhilePaused
        ) && {
          question: {
            id: this.current.id,
            category: this.current.category,
            prompt: this.current.prompt,
            choices: [...this.current.choices],
            ...(showResult && { correctIndex: this.current.correctIndex }),
          },
          deadlineAt: this.deadlineAt,
        }),
      ...(ownEntity &&
        this.current && {
          own: {
            ...(this.answers.has(ownEntity.id) && {
              answer: this.answers.get(ownEntity.id),
            }),
            proposals: ownEntity.memberIds.flatMap((id) =>
              this.proposals.has(id)
                ? [{ memberId: id, choice: this.proposals.get(id)! }]
                : [],
            ),
          },
        }),
      ...(showResult && {
        results: this.entities.map((e) => ({
          entityId: e.id,
          points:
            this.answers.get(e.id) === this.current!.correctIndex
              ? this.current!.points
              : 0,
          ...(this.answers.has(e.id) && { answer: this.answers.get(e.id) }),
          correct: this.answers.get(e.id) === this.current!.correctIndex,
        })),
      }),
    };
  }
}
