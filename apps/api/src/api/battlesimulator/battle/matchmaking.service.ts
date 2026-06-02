import { Injectable, Logger } from '@nestjs/common';

export interface QueuedPlayer {
  playerId: string;
  socketId: string;
  format: string;
  joinedAt: number;
}

export interface MatchResult {
  player1: QueuedPlayer;
  player2: QueuedPlayer;
  format: string;
}

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  // format -> queue of waiting players
  private queues: Map<string, QueuedPlayer[]> = new Map();

  // playerId -> timeout for queue expiry
  private queueTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private readonly QUEUE_TIMEOUT_MS = 60_000;

  joinQueue(player: QueuedPlayer): MatchResult | null {
    const queue = this.queues.get(player.format) ?? [];

    // Remove player if already in queue (re-join)
    this.removeFromQueue(player.playerId);

    // Check if there's someone waiting
    if (queue.length > 0) {
      const opponent = queue.shift()!;
      this.clearQueueTimeout(opponent.playerId);
      this.queues.set(player.format, queue);
      this.logger.log(
        `Match found: ${player.playerId} vs ${opponent.playerId} (${player.format})`,
      );
      return {
        player1: opponent,
        player2: player,
        format: player.format,
      };
    }

    // No opponent found — add to queue
    queue.push(player);
    this.queues.set(player.format, queue);

    // Set timeout
    const timeout = setTimeout(() => {
      this.removeFromQueue(player.playerId);
      this.logger.log(`Queue timeout for ${player.playerId} (${player.format})`);
    }, this.QUEUE_TIMEOUT_MS);
    this.queueTimeouts.set(player.playerId, timeout);

    this.logger.log(
      `${player.playerId} joined queue for ${player.format} (${queue.length} waiting)`,
    );
    return null;
  }

  leaveQueue(playerId: string): boolean {
    const removed = this.removeFromQueue(playerId);
    this.clearQueueTimeout(playerId);
    if (removed) {
      this.logger.log(`${playerId} left queue`);
    }
    return removed;
  }

  getQueueSize(format: string): number {
    return this.queues.get(format)?.length ?? 0;
  }

  getAllQueueSizes(): Record<string, number> {
    const sizes: Record<string, number> = {};
    for (const [format, queue] of this.queues.entries()) {
      sizes[format] = queue.length;
    }
    return sizes;
  }

  isPlayerQueued(playerId: string): boolean {
    for (const queue of this.queues.values()) {
      if (queue.some((p) => p.playerId === playerId)) return true;
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
