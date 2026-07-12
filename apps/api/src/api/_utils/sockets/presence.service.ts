import { Injectable } from '@nestjs/common';

export type PresenceStatus = 'online' | 'ingame' | 'offline';

/**
 * In-memory presence tracker. Written by the sockets gateway on connect/
 * disconnect and read by the chat services. A user is `ingame` when their
 * socket connection reported itself as running inside Minecraft, `online`
 * when connected from the web, and `offline` when not connected.
 */
@Injectable()
export class PresenceService {
  private readonly statuses = new Map<string, 'online' | 'ingame'>();

  setOnline(uuid: string, inGame = false): void {
    this.statuses.set(uuid, inGame ? 'ingame' : 'online');
  }

  setOffline(uuid: string): void {
    this.statuses.delete(uuid);
  }

  get(uuid: string): PresenceStatus {
    return this.statuses.get(uuid) ?? 'offline';
  }

  isOnline(uuid: string): boolean {
    return this.statuses.has(uuid);
  }
}
