import { Socket } from 'socket.io-client';
import { Protocol } from '@pkmn/protocol';
import { BattleSession, SessionCallbacks } from './BattleSession';

export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}

/**
 * A battle relayed from Pokémon Showdown.
 *
 * Two things differ from the base session and nothing else does: choices go out
 * as PS commands on the relay socket rather than as `makeChoice` events, and the
 * raw frames are kept so a replay can be saved from what actually arrived.
 */
export class ShowdownBaseSession extends BattleSession {
  chatMessages: ChatMessage[] = [];
  /**
   * Every battle line this session has been given, in order.
   *
   * Appended in exactly ONE place — the `addLine` override below — and never
   * aliased to the module-level `showdownLines` map. It used to be assigned
   * that array by reference when a room screen adopted a session from the
   * lobby, so the two grew together and `saveShowdownReplay` wrote a log with
   * every line twice (H4).
   */
  psLines: string[] = [];
  private showdownSocket: Socket;

  constructor(roomId: string, callbacks: SessionCallbacks, showdownSocket: Socket) {
    super(roomId, callbacks);
    this.showdownSocket = showdownSocket;
    // Pokemon Showdown paces this battle: nothing arrives until both players
    // have chosen, so the viewer must not be the brake. See `livePaced`.
    this.livePaced = true;
  }

  override addLine(line: string): void {
    this.psLines.push(line);
    super.addLine(line);
  }

  /**
   * Rebuild from a full log, and keep `psLines` in step with it.
   *
   * `resync` bypasses `addLine` by design (it replays onto a fresh Battle with
   * animations skipped), so the raw-line record has to be replaced here or a
   * replay saved after a re-join would be missing everything before it.
   */
  override resync(lines: string[], opts?: { seq?: number }): void {
    this.psLines = [...lines];
    super.resync(lines, opts);
  }

  private lastRequest: Protocol.Request | null = null;

  /**
   * `/choose <choice>|<rqid>`.
   *
   * The rqid is PS's own protection against a choice arriving for a turn that
   * has already resolved, and it was simply not being sent (H2): a click that
   * landed a moment after the timer picked for you was accepted as this turn's
   * move. `currentRequest` is read BEFORE `resumeAfterChoice` clears it.
   */
  override makeChoice(choice: string, _socket: Socket): void {
    if (this.status === 'finished') return;

    const request = this.currentRequest;
    const rqid = (request as any)?.rqid;
    const body = choice.startsWith('/choose ') ? choice.slice('/choose '.length) : choice;
    const psChoice = typeof rqid === 'number' ? `/choose ${body}|${rqid}` : `/choose ${body}`;
    this.showdownSocket.emit('sendToShowdown', `${this.roomId}|${psChoice}`);

    this.lastRequest = request;
    this.isWaitingForChoice = false;
    this.currentRequest = null;
    this.resumeAfterChoice();
  }

  /** Cancel a submitted choice via /undo (only before the turn resolves on PS). */
  undoChoice(): boolean {
    if (this.status === 'finished' || !this.lastRequest) return false;
    this.showdownSocket.emit('sendToShowdown', `${this.roomId}|/undo`);
    // Dedupes on rqid, so re-offering the request we just answered cannot
    // produce a second prompt if PS also re-sends it.
    this.handleRequest(this.lastRequest);
    this.lastRequest = null;
    return true;
  }

  override forfeit(_socket: Socket): void {
    this.showdownSocket.emit('sendToShowdown', `${this.roomId}|/forfeit`);
  }

  handleChatLine(line: string): boolean {
    const { args } = Protocol.parseBattleLine(line);
    if ((args[0] as string) === 'c') {
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
