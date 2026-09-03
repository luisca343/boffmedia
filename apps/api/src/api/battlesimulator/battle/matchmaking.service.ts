import { Injectable, Logger } from '@nestjs/common';

/**
 * The PvP queue: one FIFO per format, in memory.
 *
 * Single-instance by design. Two API processes would each hold half the queue
 * and never match players across them, so the deployment needs sticky sessions
 * (or a Redis adapter, which is out of scope for M2 — see the plan's §5.2).
 */

export interface QueuedPlayer {
  /** Boffmedia account id. Was a client-supplied string; now proven. */
  playerId: string;
  socketId: string;
  format: string;
  joinedAt: number;
  /** Packed team, for a team format. */
  team?: string;
  /** Display name, carried so the room does not have to look it up again. */
  name?: string;
}

export interface MatchResult {
  player1: QueuedPlayer;
  player2: QueuedPlayer;
  format: string;
}

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  private queues: Map<string, QueuedPlayer[]> = new Map();
  private queueTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private readonly QUEUE_TIMEOUT_MS = 60_000;

  joinQueue(player: QueuedPlayer): MatchResult | null {
    // Drop any earlier entry FIRST, then read the queue.
    //
    // The other order was a real bug: `removeFromQueue` splices the same array
    // this method had already captured by reference, so a re-join read a stale
    // view and could match a player against their own removed entry.
    this.removeFromQueue(player.playerId);
    this.clearQueueTimeout(player.playerId);

    const queue = this.queues.get(player.format) ?? [];

    const opponent = queue.shift();
    if (opponent) {
      this.clearQueueTimeout(opponent.playerId);
      this.queues.set(player.format, queue);
      this.logger.log(`Match found for ${player.format}`);
      return { player1: opponent, player2: player, format: player.format };
    }

    queue.push(player);
    this.queues.set(player.format, queue);

    const timeout = setTimeout(() => {
      this.removeFromQueue(player.playerId);
      this.queueTimeouts.delete(player.playerId);
    }, this.QUEUE_TIMEOUT_MS);
    timeout.unref?.();
    this.queueTimeouts.set(player.playerId, timeout);

    return null;
  }

  /** Accepts the account id in either shape; the gateway holds a number. */
  leaveQueue(playerId: string | number): boolean {
    const id = String(playerId);
    const removed = this.removeFromQueue(id);
    this.clearQueueTimeout(id);
    return removed;
  }

  getQueueSize(format: string): number {
    return this.queues.get(format)?.length ?? 0;
  }

  getAllQueueSizes(): Record<string, number> {
    const sizes: Record<string, number> = {};
    for (const [format, queue] of this.queues.entries()) sizes[format] = queue.length;
    return sizes;
  }

  isPlayerQueued(playerId: string | number): boolean {
    const id = String(playerId);
    for (const queue of this.queues.values()) {
      if (queue.some((p) => p.playerId === id)) return true;
    }
    return false;
  }

  private removeFromQueue(playerId: string): boolean {
    for (const [format, queue] of this.queues.entries()) {
      const idx = queue.findIndex((p) => p.playerId === playerId);
      if (idx !== -1) {
        queue.splice(idx, 1);
        this.queues.set(format, queue);
        return true;
      }
    }
    return false;
  }

  private clearQueueTimeout(playerId: string): void {
    const timeout = this.queueTimeouts.get(playerId);
    if (timeout) {
      clearTimeout(timeout);
      this.queueTimeouts.delete(playerId);
    }
  }
}
