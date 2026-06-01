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

  private processor: BattleEventProcessor | null = null;
  private lineBuffer: string[] = [];
  private pendingBuffer: string[] = [];
  private processing = false;
  private waiting = false;
  private pendingRequest: Protocol.Request | null = null;
  private callbacks: SessionCallbacks;
  private hasWinEvent = false;

  constructor(roomId: string, callbacks: SessionCallbacks) {
    this.roomId = roomId;
    this.battle = new Battle(new Generations(Dex as any) as any);
    this.callbacks = callbacks;
  }

  initScene(gameElement: HTMLElement): void {
    // Always re-create scene if gameElement changed (tab switch unmounts/remounts canvas)
    if (!this.scene || this.scene.gameElement !== gameElement) {
      this.scene = new Scene(this.battle, gameElement);
      this.processor = new BattleEventProcessor({
        scene: this.scene,
        battle: this.battle,
        pov: 0,
      });
      // Flush any lines that arrived before scene was ready
      this.flushBuffer();
    }
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
    if (this.processing) {
      this.pendingRequest = request;
    } else {
      this.waiting = true;
      this.isWaitingForChoice = true;
      this.currentRequest = request;
      this.callbacks.onRequest(request);
      this.callbacks.onUpdate();
    }
  }

  private async flushBuffer(): Promise<void> {
    this.processing = true;
    while (this.lineBuffer.length > 0 && !this.waiting) {
      const line = this.lineBuffer.shift()!;
      if (!line.trim()) continue;
      await this.processLine(line);
    }
    this.processing = false;

    // All lines processed — safe to show end screen now
    if (this.hasWinEvent) {
      this.battleComplete = true;
      this.hasWinEvent = false;
      this.callbacks.onUpdate();
    }

    if (this.pendingRequest && !this.waiting) {
      const req = this.pendingRequest;
      this.pendingRequest = null;
      this.waiting = true;
      this.isWaitingForChoice = true;
      this.currentRequest = req;
      this.callbacks.onRequest(req);
      this.callbacks.onUpdate();
    }
  }

  private async processLine(line: string): Promise<void> {
    const { args } = Protocol.parseBattleLine(line);

    if (!this.processor) {
      return;
    }

    let event: ProcessedBattleEvent;
    try {
      event = await this.processor.processLine(line);
    } catch (e) {
      this.callbacks.onUpdate();
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
      this.callbacks.onUpdate();
      return;
    }

    // Normal animation
    const timeout = await this.processor.runAnimation(event);
    await new Promise<void>(resolve => setTimeout(resolve, timeout));

    this.callbacks.onUpdate();
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

  getState(): BattleSessionState {
    return {
      roomId: this.roomId,
      battle: this.battle,
      scene: this.scene,
      status: this.status,
      currentRequest: this.currentRequest,
      isWaitingForChoice: this.isWaitingForChoice,
      htmlLog: this.htmlLog,
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
