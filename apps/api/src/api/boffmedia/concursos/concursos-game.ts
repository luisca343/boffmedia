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
  private pauseReason?: 'manual' | 'host_disconnected';
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
  }
  pauseForHostLoss(at: number) {
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
    this.pauseReason = 'host_disconnected';
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
        const previous = unit.memberIds.indexOf(unit.captainId!);
        unit.captainId = unit.memberIds[(previous + 1) % unit.memberIds.length];
      }
    this.selector = (this.selector + 1) % this.entities.length;
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
    if (command.action === 'choose') {
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
  view(memberId?: string): ConcursosGameDto {
    this.tick();
    const available = this.available();
    const ownEntity = this.entities.find((e) =>
      e.memberIds.includes(memberId ?? ''),
    );
    const showResult = this.stage === 'result';
    return {
      stage: this.stage,
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
