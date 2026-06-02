import { Injectable, Logger } from '@nestjs/common';
import {
  BattleRoom,
  BattleEndResult,
  BattleRoomCallbacks,
} from './battle.room';

@Injectable()
export class BattleService {
  private readonly logger = new Logger(BattleService.name);
  private rooms: Map<string, BattleRoom> = new Map();
  private playerRooms: Map<string, string> = new Map();

  createRoom(
    roomId: string,
    callbacks: BattleRoomCallbacks,
    format: string = 'gen9randombattle',
  ): BattleRoom {
    const room = new BattleRoom(roomId, callbacks);
    this.rooms.set(roomId, room);
    this.logger.log(`Room created: ${roomId}`);
    return room;
  }

  getRoom(roomId: string): BattleRoom | undefined {
    return this.rooms.get(roomId);
  }

  removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
    for (const [playerId, rid] of this.playerRooms.entries()) {
      if (rid === roomId) {
        this.playerRooms.delete(playerId);
      }
    }
    this.logger.log(`Room removed: ${roomId}`);
  }

  setPlayerRoom(playerId: string, roomId: string): void {
    this.playerRooms.set(playerId, roomId);
  }

  getPlayerRoom(playerId: string): string | undefined {
    return this.playerRooms.get(playerId);
  }

  clearPlayerRoom(playerId: string): void {
    this.playerRooms.delete(playerId);
  }

  getActiveRoomCount(): number {
    return this.rooms.size;
  }
}
