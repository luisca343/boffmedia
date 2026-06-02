import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from 'nestjs-pino';
import {
  BattleRoom,
  BattleEndResult,
  BattleRoomCallbacks,
  TimerConfig,
} from './battle.room';
import { Protocol } from '@pkmn/protocol';
import { AchievementFacadeService } from '@api/smartrotom/achievement/achievement.facade.service';

interface ClientState {
  socket: Socket;
  roomIds: Set<string>;
  playerId: string;
}

@WebSocketGateway({ namespace: '/battle', cors: true })
export class BattleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly logger: Logger,
    private readonly achievementFacade: AchievementFacadeService,
  ) {}

  @WebSocketServer() server: Server;

  private clients: Map<string, ClientState> = new Map();
  private rooms: Map<string, BattleRoom> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  private readonly RECONNECT_GRACE_MS = 30_000;

  handleConnection(client: Socket) {
    // Don't register here — wait for 'register' event with clientId
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, payload: { clientId: string }): void {
    const playerId = payload.clientId;

    const existing = this.clients.get(playerId);
    if (existing) {
      const timer = this.disconnectTimers.get(playerId);
      if (timer) {
        clearTimeout(timer);
        this.disconnectTimers.delete(playerId);
      }
      existing.socket = client;
      client.emit('connected', { playerId, reconnected: true });
      return;
    }

    this.clients.set(playerId, {
      socket: client,
      roomIds: new Set(),
      playerId,
    });
    client.emit('connected', { playerId });
  }

  handleDisconnect(client: Socket) {
    const state = this.getClientState(client);
    if (!state) return;

    if (state.roomIds.size > 0) {
      const timer = setTimeout(() => {
        this.logger.log(
          `Grace period expired for ${state.playerId}, forfeiting ${state.roomIds.size} rooms`,
        );
        for (const roomId of state.roomIds) {
          const room = this.rooms.get(roomId);
          if (room && room.getStatus() === 'active') {
            room.forfeit();
          }
          this.cleanupRoom(roomId);
        }
      }, this.RECONNECT_GRACE_MS);

      this.disconnectTimers.set(state.playerId, timer);
    } else {
      this.clients.delete(state.playerId);
    }
  }

  @SubscribeMessage('createBattle')
  handleCreateBattle(
    client: Socket,
    payload?: {
      format?: string;
      roomId?: string;
      timer?: Partial<TimerConfig>;
    },
  ): void {
    const state = this.getClientState(client);
    if (!state) return;

    const roomId = payload?.roomId || crypto.randomUUID();

    const callbacks: BattleRoomCallbacks = {
      onProtocol: (line: string) => {
        client.emit('protocol', { roomId, line });
      },
      onRequest: (request: Protocol.Request) => {
        client.emit('request', { roomId, request });
      },
      onBattleEnd: async (result: BattleEndResult) => {
        let replayId: number | undefined;
        try {
          const replayResult = await this.achievementFacade.createReplay({
            side1: result.side1,
            side2: result.side2,
            team1: JSON.stringify(result.team1),
            team2: JSON.stringify(result.team2),
            replay: result.replay,
            winner: result.winner,
          });
          replayId = replayResult.insertId;
          this.logger.log(`Replay saved: ${replayId}`);
        } catch (err: any) {
          this.logger.error(`Failed to save replay: ${err.message}`);
        }
        client.emit('battleEnd', { roomId, ...result, replayId });
        this.cleanupRoom(roomId);
      },
      onError: (error: string) => {
        this.logger.error(`Battle error [${roomId}]: ${error}`);
        client.emit('error', { roomId, message: error });
      },
      onTimerUpdate: (timerState) => {
        client.emit('timerUpdate', { roomId, ...timerState });
      },
    };

    const room = new BattleRoom(roomId, callbacks, this.logger, payload?.timer);
    this.rooms.set(roomId, room);
    state.roomIds.add(roomId);

    room
      .create(payload?.format || 'gen9randombattle')
      .then(() => {
        client.emit('battleCreated', {
          roomId,
          format: payload?.format || 'gen9randombattle',
        });
      })
      .catch((err) => {
        this.logger.error(`Failed to create battle: ${err.message}`);
        client.emit('error', {
          roomId,
          message: `Failed to create battle: ${err.message}`,
        });
        this.cleanupRoom(roomId);
      });
  }

  @SubscribeMessage('makeChoice')
  handleMakeChoice(
    client: Socket,
    payload: { roomId: string; choice: string },
  ): void {
    const state = this.getClientState(client);
    if (!state) return;

    if (!state.roomIds.has(payload.roomId)) {
      client.emit('error', {
        roomId: payload.roomId,
        message: 'Not in this battle',
      });
      return;
    }

    const room = this.rooms.get(payload.roomId);
    if (!room) {
      client.emit('error', {
        roomId: payload.roomId,
        message: 'Battle not found',
      });
      return;
    }

    room.playerChoice(payload.choice);
  }

  @SubscribeMessage('forfeit')
  handleForfeit(client: Socket, payload: { roomId: string }): void {
    const state = this.getClientState(client);
    if (!state) return;

    if (!state.roomIds.has(payload.roomId)) {
      client.emit('error', {
        roomId: payload.roomId,
        message: 'Not in this battle',
      });
      return;
    }

    const room = this.rooms.get(payload.roomId);
    if (room && room.getStatus() === 'active') {
      room.forfeit();
    }
  }

  @SubscribeMessage('spectate')
  handleSpectate(client: Socket, payload: { roomId: string }): void {
    const room = this.rooms.get(payload.roomId);
    if (!room) {
      client.emit('error', { message: 'Battle not found' });
      return;
    }

    client.emit('spectateJoined', {
      roomId: payload.roomId,
      replay: room.getReplay(),
      status: room.getStatus(),
    });
  }

  @SubscribeMessage('reconnect')
  handleReconnect(
    client: Socket,
    payload: { playerId: string; roomId: string },
  ): void {
    const existingState = this.clients.get(payload.playerId);
    if (!existingState) {
      client.emit('error', { message: 'Session not found' });
      return;
    }

    const timer = this.disconnectTimers.get(payload.playerId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(payload.playerId);
    }

    existingState.socket = client;

    const room = this.rooms.get(payload.roomId);
    if (room) {
      existingState.roomIds.add(payload.roomId);
      client.emit('reconnected', {
        roomId: payload.roomId,
        status: room.getStatus(),
      });
    }
  }

  private getClientState(client: Socket): ClientState | undefined {
    for (const state of this.clients.values()) {
      if (state.socket === client) return state;
    }
    return undefined;
  }

  private cleanupRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const [, state] of this.clients.entries()) {
      state.roomIds.delete(roomId);
    }

    this.rooms.delete(roomId);
  }
}
