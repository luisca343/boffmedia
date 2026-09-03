import { Battle } from '@pkmn/client';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { Protocol } from '@pkmn/protocol';
import { Scene } from './Scene';
import { BattleEventProcessor, ProcessedBattleEvent } from './BattleEventProcessor';

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
}

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
   * queue to drain before it prompts (see `pendingRequest`) — it just no longer
   * dams the incoming stream behind it.
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

  private processor: BattleEventProcessor | null = null;
  private lineBuffer: string[] = [];
  private pendingBuffer: string[] = [];
  private processing = false;
  private waiting = false;
  private destroyed = false;
  private pendingRequest: Protocol.Request | null = null;
  callbacks: SessionCallbacks;
  private hasWinEvent = false;

  constructor(roomId: string, callbacks: SessionCallbacks) {
    this.roomId = roomId;
    this.battle = new Battle(new Generations(Dex as any) as any);
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

  initScene(gameElement: HTMLElement, pov: 0 | 1 = 0): void {
    // Always re-create scene if gameElement changed (tab switch unmounts/remounts canvas)
    if (!this.scene || this.scene.gameElement !== gameElement) {
      this.scene = new Scene(this.battle, gameElement);
      this.processor = new BattleEventProcessor({
        scene: this.scene,
        battle: this.battle,
        pov,
        viewerName: this.viewerName,
      });
      // Resolves the side immediately when the battle already carries the
      // `|player|` lines — the case when a room screen adopts a battle the
      // lobby had been following.
      if (this.viewerName) this.processor.setViewerName(this.viewerName);
      // Flush any lines that arrived before scene was ready
      this.flushBuffer();
      return;
    }
    // Same element, new pov. This used to fall through and do NOTHING, which
    // is how the animation side got frozen at whatever was known when the
    // canvas first mounted — usually 0, because the `|player|` lines had not
    // been processed yet. React re-laid the field out from the corrected pov;
    // the animations stayed on the stale one, so a p2 player watched their own
    // attacks play from the opponent's side.
    //
    // Ignored when a `viewerName` is set: the protocol is then the authority
    // and an argument from a caller that re-renders with a stale value (the
    // Showdown room's default of 0) must not undo it.
    if (!this.viewerName) this.processor?.setPov(pov);
  }

  addLine(line: string): void {
    if (this.waiting) {
      this.pendingBuffer.push(line);
      return;
    }
    this.lineBuffer.push(line);
    if (!this.processing) {
      this.flushBuffer();
    }
  }

  handleRequest(request: Protocol.Request): void {
    // "wait" requests mean the opponent is still acting — don't prompt the user
    if ((request as any).wait) {
      return;
    }
    // `lineBuffer.length` as well as `processing`: a request that arrives while
    // lines are still queued must NOT flip `waiting`, or `addLine` starts
    // diverting everything after it into `pendingBuffer` and the battle sits at
    // turn 0 with a full move list and an empty log. Whoever drains the buffer
    // promotes the pending request afterwards, which is the same order the
    // server sent them in.
    if (this.processing || this.lineBuffer.length > 0) {
      this.pendingRequest = request;
    } else {
      // `waiting` only where the viewer is the brake. See `livePaced`.
      this.waiting = !this.livePaced;
      this.isWaitingForChoice = true;
      this.currentRequest = request;
      this.callbacks.onRequest(request);
      this.notify();
    }
  }

  private async flushBuffer(): Promise<void> {
    // NOTHING is processed before the scene exists, and nothing is thrown away
    // either — the lines stay in the buffer and `initScene` flushes them.
    //
    // They used to be consumed here and dropped on the floor by `processLine`'s
    // `if (!this.processor) return`, which is why a battle started while the
    // worker was already warm could open with no `|player|`, no `|switch|` and
    // an empty log: the simulator posts every opening line and the first
    // request BEFORE `battleCreated`, and it is `battleCreated` that puts the
    // canvas — and therefore the processor — on screen. The first battle of a
    // session got away with it only because a cold worker is slow enough for
    // the canvas to win the race.
    if (!this.processor) return;
    this.processing = true;
    while (this.lineBuffer.length > 0 && !this.waiting && !this.destroyed) {
      const line = this.lineBuffer.shift()!;
      if (!line.trim()) continue;
      await this.processLine(line);
    }
    this.processing = false;

    if (this.destroyed) return;

    // All lines processed — safe to show end screen now
    if (this.hasWinEvent) {
      this.battleComplete = true;
      this.hasWinEvent = false;
      this.pendingRequest = null; // Don't prompt for choice after battle ends
      this.notify();
    }

    if (this.pendingRequest && !this.waiting && !this.battleComplete) {
      const req = this.pendingRequest;
      this.pendingRequest = null;
      this.waiting = !this.livePaced;
      this.isWaitingForChoice = true;
      this.currentRequest = req;
      this.callbacks.onRequest(req);
      this.notify();
    }
  }

  private async processLine(line: string): Promise<void> {
    const { args } = Protocol.parseBattleLine(line);

    // Request lines are not battle events — handle them directly
    if (args[0] === 'request') {
      try {
        const request = JSON.parse(args[1] as string) as Protocol.Request;
        this.handleRequest(request);
      } catch {}
      return;
    }

    if (!this.processor) {
      return;
    }

    let event: ProcessedBattleEvent;
    try {
      event = await this.processor.processLine(line);
    } catch (e) {
      this.notify();
      return;
    }

    // Update log
    this.htmlLog.push(event.html);
    const clearActions = ['switch', 'move', 'turn'];
    if (clearActions.includes(event.type)) {
      this.messageBar = [event.html];
    } else {
      this.messageBar.push(event.html);
    }

    // Win/tie — run animation but don't set battleComplete yet (more lines may follow)
    if (event.type === 'win' || event.type === 'tie') {
      this.hasWinEvent = true;
      const timeout = await this.processor.runAnimation(event);
      await new Promise<void>(resolve => setTimeout(resolve, timeout));
      this.callbacks.onBattleEnd(event.args[1] as string);
      this.notify();
      return;
    }

    // Normal animation
    const timeout = await this.processor.runAnimation(event);
    await new Promise<void>(resolve => setTimeout(resolve, timeout));

    this.notify();
  }

  resumeAfterChoice(): void {
    this.waiting = false;
    this.isWaitingForChoice = false;
    this.currentRequest = null;
    this.pendingRequest = null;

    // Move pending lines to main buffer
    if (this.pendingBuffer.length > 0) {
      this.lineBuffer.push(...this.pendingBuffer);
      this.pendingBuffer = [];
    }

    if (this.lineBuffer.length > 0) {
      this.flushBuffer();
    }
  }

  makeChoice(choice: string, socket: any): void {
    if (this.status === 'finished') return;
    socket.emit('makeChoice', { roomId: this.roomId, choice });
    this.isWaitingForChoice = false;
    this.currentRequest = null;
    this.resumeAfterChoice();
  }

  forfeit(socket: any): void {
    socket.emit('forfeit', { roomId: this.roomId });
  }

  destroy(): void {
    this.destroyed = true;
    this.lineBuffer = [];
    this.pendingBuffer = [];
  }

  /** The one place a visible change is announced. See `revision`. */
  private notify(): void {
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
    };
  }
}
