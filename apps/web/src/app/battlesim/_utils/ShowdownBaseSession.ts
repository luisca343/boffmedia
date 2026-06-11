import { Socket } from 'socket.io-client';
import { Protocol } from '@pkmn/protocol';
import { BattleSession, SessionCallbacks } from './BattleSession';

export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}

export class ShowdownBaseSession extends BattleSession {
  chatMessages: ChatMessage[] = [];
  psLines: string[] = [];
  pendingShowdownRequest: Protocol.Request | null = null;
  private showdownSocket: Socket;

  constructor(roomId: string, callbacks: SessionCallbacks, showdownSocket: Socket) {
    super(roomId, callbacks);
    this.showdownSocket = showdownSocket;
  }

  override addLine(line: string): void {
    this.psLines.push(line);
    super.addLine(line);
  }

  override initScene(gameElement: HTMLElement, pov: 0 | 1 = 0): void {
    super.initScene(gameElement, pov);
    // Process pending request after scene is ready
    if (this.pendingShowdownRequest) {
      this.handleRequest(this.pendingShowdownRequest);
      this.pendingShowdownRequest = null;
    }
  }

  private lastRequest: Protocol.Request | null = null;

  override makeChoice(choice: string, _socket: Socket): void {
    if (this.status === 'finished') return;

    const psChoice = choice.startsWith('/choose ') ? choice : `/choose ${choice}`;
    this.showdownSocket.emit('sendToShowdown', `${this.roomId}|${psChoice}`);

    this.lastRequest = this.currentRequest;
    this.isWaitingForChoice = false;
    this.currentRequest = null;
    this.resumeAfterChoice();
  }

  /** Cancel a submitted choice via /undo (only before the turn resolves on PS). */
  undoChoice(): boolean {
    if (this.status === 'finished' || !this.lastRequest) return false;
    this.showdownSocket.emit('sendToShowdown', `${this.roomId}|/undo`);
    this.handleRequest(this.lastRequest);
    this.lastRequest = null;
    return true;
  }

  override forfeit(_socket: Socket): void {
    this.showdownSocket.emit('sendToShowdown', `${this.roomId}|/forfeit`);
  }

  handleChatLine(line: string): boolean {
    const { args } = Protocol.parseBattleLine(line);
    if (args[0] === 'c') {
      // |c|USERNAME|MESSAGE
      this.chatMessages.push({
        sender: args[1] as string,
        message: args[2] as string,
        timestamp: Date.now(),
      });
      return true;
    }
    if (args[0] === 'c:') {
      // |c:|TIMESTAMP|USERNAME|MESSAGE
      this.chatMessages.push({
        sender: args[2] as string,
        message: args[3] as string,
        timestamp: Number(args[1]) || Date.now(),
      });
      return true;
    }
    return false;
  }
}
