import { Battle } from '@pkmn/client';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { Protocol } from '@pkmn/protocol';
import { Scene, SKIP_ANIMS_AT } from './Scene';
import { BattleEventProcessor, ProcessedBattleEvent } from './BattleEventProcessor';
import { TurnLedger } from './TurnLedger';

export type LiveBattleStatus = 'idle' | 'connecting' | 'active' | 'finished' | 'error';

export interface TimerState {
  p1: { turnRemaining: number; totalRemaining: number };
  p2: { turnRemaining: number; totalRemaining: number };
  activeSide: 'p1' | 'p2' | null;
}

export interface SessionCallbacks {
  onUpdate: () => void;
  onRequest: (request: Protocol.Request) => void;
  onBattleEnd: (winner: string) => void;
  /**
   * A sequenced frame arrived out of order — everything between `lastSeq` and
   * `seq` was lost. The transport answers by asking for a full log and calling
   * `resync`; the session accepts the frame anyway so a transport that cannot
   * resync still moves.
   */
  onGap?: (lastSeq: number, seq: number) => void;
}

/** Anything that can carry a choice back to whoever is running the battle. */
export interface ChoiceTransport {
  emit(event: string, payload: any): void;
}

export interface BattleSessionState {
  roomId: string;
  battle: Battle;
  /** Increments on every visible change. See `BattleSession.revision`. */
  revision: number;
  scene: Scene | null;
  status: LiveBattleStatus;
  currentRequest: Protocol.Request | null;
  isWaitingForChoice: boolean;
  htmlLog: string[];
  messageBar: string[];
  winner: string | null;
  replay: string | null;
  replayId: number | null;
  error: string | null;
  timerState: TimerState | null;
  battleComplete: boolean;
  /** What happened this turn, per Pokemon. See `TurnLedger`. */
  ledger: TurnLedger;
}

const newBattle = () => new Battle(new Generations(Dex as any) as any);

export class BattleSession {
  readonly roomId: string;
  battle: Battle;
  scene: Scene | null = null;
  status: LiveBattleStatus = 'connecting';
  currentRequest: Protocol.Request | null = null;
  isWaitingForChoice = false;
  htmlLog: string[] = [];
  messageBar: string[] = [];
  winner: string | null = null;
  replay: string | null = null;
  replayId: number | null = null;
  error: string | null = null;
  timerState: TimerState | null = null;
  battleComplete = false;

  /** What happened this turn, per Pokemon. Rebuilt by `resync`. */
  readonly ledger = new TurnLedger();

  /**
   * The unanswered request waiting to prompt — at most one.
   *
   * A newer request SUPERSEDES every earlier unanswered one, which is what
   * Showdown means by rqid. Draining them oldest-first instead offered the
   * dock a move list for a turn the field had long passed (turn 5 reached,
   * rqid 2 on offer) whenever several arrived before the buffer drained: a
   * resync replay, a PS re-send, a spectator becoming a player.
   */
  pendingRequests: Protocol.Request[] = [];

  /**
   * Whether the SERVER paces this battle.
   *
   * A local simulator computes the whole battle as fast as it can, so the
   * viewer has to be the brake: `waiting` stops the queue at each decision
   * point, and only the viewer's own choice releases it. A live battle is the
   * opposite — nothing arrives until both players have chosen, so there is
   * nothing to hold back, and holding back is actively wrong: it makes the
   * viewer's own choice the ONLY thing that can advance the display. Play the
   * same battle in the official client and Boffmedia freezes; let the timer
   * pick for you and it freezes; have the opponent forfeit while you are
   * deciding and you never see the end screen. The request still waits for the
   * queue to drain before it prompts — it just no longer dams the incoming
   * stream behind it.
   */
  livePaced = false;

  /**
   * Bumped on every visible change, and it EXISTS TO BE A CHANGED PROP.
   *
   * `BattleCanvas` is `memo`'d, and every prop it takes is identity-stable for
   * the whole battle — `battle` most of all, because a @pkmn/client Battle is
   * mutated in place and never replaced. So the shallow comparison saw nothing
   * change and the canvas simply stopped re-rendering: HP bars moved only when
   * some unrelated prop happened to change, a switch showed up a turn late, and
   * the opening sprites took until the first interaction to appear. The parent
   * was re-rendering correctly the whole time; `memo` was throwing it away.
   */
  revision = 0;

  callbacks: SessionCallbacks;

  private processor: BattleEventProcessor | null = null;
  private lineBuffer: string[] = [];
  private pendingBuffer: string[] = [];
  private processing = false;
  private waiting = false;
  private destroyed = false;
  private hasWinEvent = false;
  /** `|win|` fires ONCE per session, however many times it is delivered. */
  private endAnnounced = false;
  private seenRqids = new Set<number>();
  /** Highest rqid ever accepted. Anything below it is a stale re-delivery. */
  private latestRqid = -1;
  private lastSeq = -1;
  private acceleration = 1;
  private pov: 0 | 1 = 0;
  private viewerSide: 'p1' | 'p2' | null = null;
  private committedRevision = -1;
  private commitWaiters: Array<{ rev: number; resolve: () => void; timer: ReturnType<typeof setTimeout> }> = [];
  private timers = new Set<ReturnType<typeof setTimeout>>();
  /**
   * Bumped by `resync()` and `destroy()`. Everything already in flight — a
   * flush mid-loop, a `processLine` parked on an animation — compares the
   * value it captured and abandons itself, so a line that was being applied
   * when the state was rebuilt underneath it cannot append to the new log.
   */
  private syncEpoch = 0;
  /** A log handed to `resync` before a canvas existed. Applied by `initScene`. */
  private pendingSync: string[] | null = null;

  constructor(roomId: string, callbacks: SessionCallbacks) {
    this.roomId = roomId;
    this.battle = newBattle();
    this.callbacks = callbacks;
  }

  /**
   * The viewer's own player name, for battles where the side is not handed to
   * us. See `BattleEventProcessorContext.viewerName`.
   */
  private viewerName: string | null = null;

  setViewerName(name: string | null): void {
    this.viewerName = name;
    this.processor?.setViewerName(name);
  }

  /**
   * The viewer's side, stated outright (PvP, local). Beats any `pov` a caller
   * passes to `initScene` — that argument is a guess made at mount time, and a
   * re-render with a stale one must not undo a known side.
   */
  setViewerSide(side: 'p1' | 'p2' | null): void {
    this.viewerSide = side;
    if (!side) return;
    this.pov = side === 'p2' ? 1 : 0;
    this.processor?.setPov(this.pov);
  }

  /** 1 = real time. `>= 8` skips animations outright. */
  setAcceleration(n: number): void {
    this.acceleration = n > 0 ? n : 1;
    this.scene?.setAcceleration(this.acceleration);
  }

  get skipAnims(): boolean {
    return this.acceleration >= SKIP_ANIMS_AT;
  }

  initScene(gameElement: HTMLElement, pov: 0 | 1 = 0): void {
    if (this.destroyed) return;

    // Same element: only the pov can have changed. This used to fall through
    // and do NOTHING, which is how the animation side got frozen at whatever
    // was known when the canvas first mounted — usually 0, because the
    // `|player|` lines had not been processed yet.
    if (this.scene && this.scene.gameElement === gameElement) {
      this.adoptPov(pov);
      this.drainPendingSync();
      void this.flushBuffer();
      return;
    }

    const previous = this.scene;
    this.scene = new Scene(this.battle, gameElement);
    this.scene.setAcceleration(this.acceleration);
    previous?.destroy();

    if (this.processor) {
      // REBOUND, not rebuilt. A new processor means a new LogFormatter, and a
      // LogFormatter learns the trainers' names from the `|player|` lines it
      // formatted — a fresh one has already missed them, so every line after a
      // canvas remount reads "Player 1".
      this.processor.setScene(this.scene);
      this.adoptPov(pov);
    } else {
      this.processor = new BattleEventProcessor({
        scene: this.scene,
        battle: this.battle,
        pov: this.viewerSide ? this.pov : pov,
        viewerName: this.viewerName,
        commit: () => this.awaitCommit(),
        ledger: this.ledger,
      });
      if (!this.viewerSide) this.pov = pov;
      // Resolves the side immediately when the battle already carries the
      // `|player|` lines — the case when a room screen adopts a battle the
      // lobby had been following.
      if (this.viewerName) this.processor.setViewerName(this.viewerName);
    }

    this.drainPendingSync();
    void this.flushBuffer();
  }

  /** The protocol (viewerName) and an explicit side both outrank the argument. */
  private adoptPov(pov: 0 | 1): void {
    if (this.viewerName || this.viewerSide) return;
    this.pov = pov;
    this.processor?.setPov(pov);
  }

  addLine(line: string): void {
    if (this.destroyed) return;
    if (this.waiting) {
      this.pendingBuffer.push(line);
      return;
    }
    this.lineBuffer.push(line);
    if (!this.processing) {
      void this.flushBuffer();
    }
  }

  /**
   * `addLine` for a transport that numbers its frames.
   *
   * Duplicates (a resend, a double subscription) are dropped instead of being
   * applied twice; a hole in the numbering is reported so the caller can ask
   * for the full log, and the frame is still accepted so a transport that
   * cannot resync is not stuck.
   */
  acceptFrame(seq: number | undefined, line: string): boolean {
    if (this.destroyed) return false;
    if (typeof seq !== 'number' || !Number.isFinite(seq)) {
      this.addLine(line);
      return true;
    }
    if (seq <= this.lastSeq) return false;
    if (this.lastSeq !== -1 && seq > this.lastSeq + 1) {
      this.callbacks.onGap?.(this.lastSeq, seq);
    }
    this.lastSeq = seq;
    this.addLine(line);
    return true;
  }

  /** The last sequence number accepted, or -1. */
  get sequence(): number {
    return this.lastSeq;
  }

  /**
   * Rebuilds the whole client state from a log. IDEMPOTENT: the same lines
   * twice produce the same battle, the same ledger and a log of the same
   * length — because everything is thrown away first and replayed onto a
   * FRESH Battle. Feeding a replay into the battle that was already following
   * it is what produced doubled logs and half-applied HP.
   */
  resync(lines: string[], opts?: { seq?: number }): void {
    if (this.destroyed) return;

    // Abandon anything in flight, including a flush that is mid-await.
    this.syncEpoch++;
    this.processing = false;
    this.waiting = false;
    this.lineBuffer = [];
    this.pendingBuffer = [];
    this.pendingRequests = [];
    this.pendingSync = null;
    this.seenRqids.clear();
    this.latestRqid = -1;
    this.currentRequest = null;
    this.isWaitingForChoice = false;
    this.htmlLog = [];
    this.messageBar = [];
    this.hasWinEvent = false;
    this.battleComplete = false;
    this.ledger.reset();

    this.battle = newBattle();
    this.scene?.setBattle(this.battle);

    // REBUILT, not rebound — the one place where that is the right answer.
    // A line parked inside the old processor's `await` resumes after this and
    // calls `battle.add` on whatever battle ITS context holds; mutating the
    // context in place handed it the freshly rebuilt battle, so an abandoned
    // `|-damage|` still landed on the state it had just been erased from.
    // Giving it the old processor leaves that write on an orphan nobody reads.
    // Safe here (unlike a canvas remount) because the replay below feeds the
    // new LogFormatter the `|player|` lines again, so it re-learns the names.
    if (this.scene) {
      this.processor = new BattleEventProcessor({
        scene: this.scene,
        battle: this.battle,
        pov: this.pov,
        viewerName: this.viewerName,
        commit: () => this.awaitCommit(),
        ledger: this.ledger,
      });
      if (this.viewerName) this.processor.setViewerName(this.viewerName);
    } else {
      this.processor = null;
    }

    this.lastSeq = opts?.seq ?? -1;

    if (!this.processor) {
      // No canvas yet — a room adopting a lobby session, or a reconnect while
      // the tab is in the background. The log is KEPT, not dropped: `initScene`
      // applies it the moment a scene exists.
      this.pendingSync = [...lines];
      this.notify();
      return;
    }

    this.pendingSync = null;
    this.applySyncLines(lines);
    this.notify();
  }

  /** Replays a log with no animation and no awaiting. Assumes a fresh battle. */
  private applySyncLines(lines: string[]): void {
    let sawWin: string | null = null;
    for (const raw of lines) {
      if (!raw || !raw.trim()) continue;
      const { args } = Protocol.parseBattleLine(raw);
      if (args[0] === 'request') {
        this.queueRequest(this.parseRequest(args[1] as string, raw));
        continue;
      }
      if (!this.processor) continue;
      const event = this.processor.applySync(raw);
      this.htmlLog.push(event.html);
      if (event.type === 'win' || event.type === 'tie') {
        sawWin = (event.args[1] as string) ?? '';
      }
    }

    if (sawWin !== null) {
      this.battleComplete = true;
      this.pendingRequests = [];
      this.announceEnd(sawWin);
    } else {
      this.promoteRequest();
    }
  }

  /** Applies a log that arrived before there was a canvas to apply it to. */
  private drainPendingSync(): void {
    if (!this.pendingSync || !this.processor) return;
    const lines = this.pendingSync;
    this.pendingSync = null;
    this.applySyncLines(lines);
    this.notify();
  }

  // ── requests ──────────────────────────────────────────────────────────────

  handleRequest(request: Protocol.Request): void {
    if (!this.queueRequest(request)) return;
    // Promotion only when the queue in front of it has drained: a request that
    // jumps its own lines shows a move list for a turn the field has not
    // reached yet.
    if (!this.processing && this.lineBuffer.length === 0) {
      this.promoteRequest();
    }
  }

  private parseRequest(json: string, line: string): Protocol.Request | null {
    if (!json) return null;
    try {
      return JSON.parse(json) as Protocol.Request;
    } catch (e) {
      console.warn('[battlesim] malformed |request| JSON', line, e);
      return null;
    }
  }

  /** Returns whether the request was actually enqueued. */
  private queueRequest(request: Protocol.Request | null): boolean {
    if (!request || this.destroyed) return false;
    // "wait" means the opponent is still acting — there is nothing to prompt.
    if ((request as any).wait) return false;
    const rqid = (request as any).rqid;
    if (typeof rqid === 'number') {
      if (this.seenRqids.has(rqid)) return false;      // the same one, twice
      if (rqid < this.latestRqid) return false;        // a stale re-delivery
      this.seenRqids.add(rqid);
      this.latestRqid = rqid;
    }
    // Supersede: only the latest request is ever promoted. An unanswered
    // earlier one is not a queue entry, it is a question the server has
    // already stopped waiting for an answer to.
    this.pendingRequests = [request];
    if (this.currentRequest && this.currentRequest !== request) {
      this.currentRequest = null;
      this.isWaitingForChoice = false;
      // Release the brake the superseded request set, so the newer one can
      // take its place instead of waiting on a choice nobody will make.
      this.waiting = false;
    }
    return true;
  }

  private promoteRequest(): void {
    if (this.destroyed || this.waiting || this.battleComplete) return;
    const request = this.pendingRequests.shift();
    if (!request) return;
    // `waiting` only where the viewer is the brake. See `livePaced`.
    this.waiting = !this.livePaced;
    this.isWaitingForChoice = true;
    this.currentRequest = request;
    this.callbacks.onRequest(request);
    this.notify();
  }

  // ── pipeline ──────────────────────────────────────────────────────────────

  private async flushBuffer(): Promise<void> {
    // Re-entrancy guard. `initScene` runs on every canvas mount and used to
    // start a second drain over the same buffer, so a line could be applied
    // twice — a doubled `|-damage|` reads as a Pokemon taking a hit it never
    // took.
    if (this.processing || this.destroyed || !this.processor) return;

    const epoch = this.syncEpoch;
    this.processing = true;
    try {
      while (
        this.lineBuffer.length > 0 &&
        !this.waiting &&
        !this.destroyed &&
        this.syncEpoch === epoch
      ) {
        const line = this.lineBuffer.shift()!;
        if (!line.trim()) continue;
        await this.processLine(line);
      }
    } finally {
      if (this.syncEpoch === epoch) this.processing = false;
    }

    if (this.destroyed || this.syncEpoch !== epoch) return;

    // All lines processed — safe to show the end screen now.
    if (this.hasWinEvent) {
      this.battleComplete = true;
      this.hasWinEvent = false;
      this.pendingRequests = []; // Don't prompt for a choice after the battle ends
      this.notify();
    }

    if (this.pendingRequests.length > 0 && !this.waiting && !this.battleComplete) {
      this.promoteRequest();
    }
  }

  private async processLine(line: string): Promise<void> {
    const { args } = Protocol.parseBattleLine(line);

    // Request lines are not battle events — handle them directly.
    if (args[0] === 'request') {
      const request = this.parseRequest(args[1] as string, line);
      if (request) this.handleRequest(request);
      return;
    }

    if (!this.processor) return;

    // Captured before the first await. A `resync` (or a `destroy`) that lands
    // while this line is parked on a hook or an animation has already thrown
    // away the state this line belongs to — appending its html afterwards left
    // the rebuilt log one entry longer than the log it was rebuilt from.
    const epoch = this.syncEpoch;

    let event: ProcessedBattleEvent;
    try {
      event = await this.processor.processLine(line);
    } catch (e) {
      console.warn('[battlesim] processLine failed', line, e);
      if (this.syncEpoch !== epoch) return;
      this.notify();
      return;
    }
    if (this.syncEpoch !== epoch) return;

    this.htmlLog.push(event.html);
    const clearActions = ['switch', 'drag', 'replace', 'move', 'turn'];
    if (clearActions.includes(event.type)) {
      this.messageBar = [event.html];
    } else {
      this.messageBar.push(event.html);
    }

    // The state is applied: TELL REACT NOW. The animation runs against the
    // rendered result, not before it — that is what `ctx.commit()` waits for,
    // and it is why the outgoing Pokemon no longer stands in its slot for the
    // length of the switch.
    this.notify();

    const timeout = await this.processor.runAnimation(event);
    if (this.syncEpoch !== epoch) return;

    if (event.type === 'win' || event.type === 'tie') {
      // Don't set battleComplete yet — more lines may follow.
      this.hasWinEvent = true;
      await this.sleep(timeout);
      if (this.syncEpoch !== epoch) return;
      this.announceEnd((event.args[1] as string) ?? '');
      this.notify();
      return;
    }

    await this.sleep(timeout);
    if (this.syncEpoch !== epoch) return;
    this.notify();
  }

  /** `onBattleEnd` fires once per session, whatever the transport does. */
  private announceEnd(winner: string): void {
    if (this.endAnnounced || this.destroyed) return;
    this.endAnnounced = true;
    this.callbacks.onBattleEnd(winner);
  }

  private sleep(ms: number): Promise<void> {
    if (this.destroyed || this.skipAnims || !(ms > 0)) return Promise.resolve();
    return new Promise(resolve => {
      const id = setTimeout(() => {
        this.timers.delete(id);
        resolve();
      }, ms);
      this.timers.add(id);
    });
  }

  // ── commit handshake ──────────────────────────────────────────────────────

  /**
   * Resolves once React has committed the current revision.
   *
   * The canvas reports back from a layout effect on `[revision]`. There is a
   * 64 ms fallback because the engine must never be hostage to a renderer:
   * an unmounted canvas, a suspended tree or a host that simply does not call
   * back would otherwise freeze the battle permanently.
   */
  awaitCommit(): Promise<void> {
    if (this.destroyed || !this.scene || this.skipAnims) return Promise.resolve();
    const target = this.revision;
    if (this.committedRevision >= target) return Promise.resolve();
    return new Promise<void>(resolve => {
      const entry = {
        rev: target,
        resolve,
        timer: setTimeout(() => {
          const i = this.commitWaiters.indexOf(entry);
          if (i >= 0) this.commitWaiters.splice(i, 1);
          resolve();
        }, 64),
      };
      this.commitWaiters.push(entry);
    });
  }

  /** Called by the canvas from a layout effect on `[revision]`. */
  onCommitted(revision: number): void {
    if (revision > this.committedRevision) this.committedRevision = revision;
    if (this.commitWaiters.length === 0) return;
    const ready = this.commitWaiters.filter(w => w.rev <= this.committedRevision);
    this.commitWaiters = this.commitWaiters.filter(w => w.rev > this.committedRevision);
    for (const w of ready) {
      clearTimeout(w.timer);
      w.resolve();
    }
  }

  // ── choices ───────────────────────────────────────────────────────────────

  resumeAfterChoice(): void {
    if (this.destroyed) return;
    this.waiting = false;
    this.isWaitingForChoice = false;
    this.currentRequest = null;

    // Move pending lines to the main buffer
    if (this.pendingBuffer.length > 0) {
      this.lineBuffer.push(...this.pendingBuffer);
      this.pendingBuffer = [];
    }

    void this.flushBuffer();
  }

  /**
   * `rqid` rides along so the server can reject a choice for a turn that has
   * already resolved — without it a late click was accepted as this turn's.
   */
  makeChoice(choice: string, socket: ChoiceTransport): void {
    // `battleComplete` as well as the status: a local battle is never given
    // the `'finished'` status at all (the worker's `battleEnd` deliberately
    // leaves it alone so the end screen waits for the animation queue), so
    // this guard read only half the question.
    if (this.status === 'finished' || this.battleComplete || this.destroyed) return;
    const rqid = (this.currentRequest as any)?.rqid;
    socket.emit('makeChoice', { roomId: this.roomId, choice, rqid });
    this.isWaitingForChoice = false;
    this.currentRequest = null;
    this.resumeAfterChoice();
  }

  forfeit(socket: ChoiceTransport): void {
    socket.emit('forfeit', { roomId: this.roomId });
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.syncEpoch++;
    this.lineBuffer = [];
    this.pendingBuffer = [];
    this.pendingRequests = [];
    this.pendingSync = null;
    for (const id of this.timers) clearTimeout(id);
    this.timers.clear();
    // Nothing may be left awaiting a commit that will never come.
    const waiters = this.commitWaiters;
    this.commitWaiters = [];
    for (const w of waiters) {
      clearTimeout(w.timer);
      w.resolve();
    }
    this.scene?.destroy();
  }

  /** The one place a visible change is announced. See `revision`. */
  private notify(): void {
    if (this.destroyed) return;
    this.revision++;
    this.callbacks.onUpdate();
  }

  getState(): BattleSessionState {
    return {
      roomId: this.roomId,
      battle: this.battle,
      scene: this.scene,
      status: this.status,
      currentRequest: this.currentRequest,
      isWaitingForChoice: this.isWaitingForChoice,
      htmlLog: this.htmlLog,
      revision: this.revision,
      messageBar: this.messageBar,
      winner: this.winner,
      replay: this.replay,
      replayId: this.replayId,
      error: this.error,
      timerState: this.timerState,
      battleComplete: this.battleComplete,
      ledger: this.ledger,
    };
  }
}
