import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from 'nestjs-pino';
import { BattleRoom, BattleEndResult, BattleRoomCallbacks } from './battle.room';
import { Protocol } from '@pkmn/protocol';
import { AchievementFacadeService } from '@api/smartrotom/achievement/achievement.facade.service';

interface ClientState {
  socket: Socket;
  roomId: string | null;
  playerId: string;
}

@WebSocketGateway({ namespace: '/battle', cors: true })
export class BattleGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
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
    this.logger.log(`Socket connected (awaiting register): ${client.id}`);
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, payload: { clientId: string }): void {
    const playerId = payload.clientId;

    // If this clientId already exists (reconnect), update the socket
    const existing = this.clients.get(playerId);
    if (existing) {
      this.logger.log(`Battle client reconnected: ${playerId} (existing roomId: ${existing.roomId})`);
      const timer = this.disconnectTimers.get(playerId);
      if (timer) {
        clearTimeout(timer);
        this.disconnectTimers.delete(playerId);
      }
      existing.socket = client;
      client.emit('connected', { playerId, reconnected: true });
      return;
    }

    this.logger.log(`Battle client registered: ${playerId}`);
    this.clients.set(playerId, { socket: client, roomId: null, playerId });
    client.emit('connected', { playerId });
  }

  handleDisconnect(client: Socket) {
    const state = this.getClientState(client);
    if (!state) {
      this.logger.log(`Socket disconnected (unregistered): ${client.id}`);
      return;
    }

    this.logger.log(`Battle client disconnected: ${state.playerId}`);

    if (state.roomId) {
      const timer = setTimeout(() => {
        this.logger.log(
          `Grace period expired for ${state.playerId}, forfeiting room ${state.roomId}`,
        );
        const room = this.rooms.get(state.roomId!);
        if (room && room.getStatus() === 'active') {
          room.forfeit();
        }
        this.cleanupRoom(state.roomId!);
      }, this.RECONNECT_GRACE_MS);

      this.disconnectTimers.set(state.playerId, timer);
    } else {
      this.clients.delete(state.playerId);
    }
  }

  @SubscribeMessage('createBattle')
  handleCreateBattle(client: Socket, payload?: { format?: string }): void {
    const state = this.getClientState(client);
    if (!state) return;

    if (state.roomId) {
      const existingRoom = this.rooms.get(state.roomId);
      if (existingRoom && existingRoom.getStatus() === 'active') {
        this.logger.log(`Client already in battle ${state.roomId}, returning existing`);
        client.emit('battleCreated', {
          roomId: state.roomId,
          format: payload?.format || 'gen9randombattle',
        });
        return;
      }
    }

    const roomId = crypto.randomUUID();

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
    };

    const room = new BattleRoom(roomId, callbacks, this.logger);
    this.rooms.set(roomId, room);
    state.roomId = roomId;

    room
      .create(payload?.format || 'gen9randombattle')
      .then(() => {
        client.emit('battleCreated', {
          roomId,
          format: payload?.format || 'gen9randombattle',
        });
        this.logger.log(`Battle created: ${roomId} for ${state.playerId}`);
      })
      .catch((err) => {
        this.logger.error(`Failed to create battle: ${err.message}`);
        client.emit('error', { message: `Failed to create battle: ${err.message}` });
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

    if (state.roomId !== payload.roomId) {
      this.logger.warn(`[makeChoice] roomId mismatch: state=${state.roomId} payload=${payload.roomId}`);
      client.emit('error', { message: 'Not in this battle' });
      return;
    }

    const room = this.rooms.get(payload.roomId);
    if (!room) {
      client.emit('error', { message: 'Battle not found' });
      return;
    }

    room.playerChoice(payload.choice);
  }

  @SubscribeMessage('forfeit')
  handleForfeit(client: Socket, payload: { roomId: string }): void {
    const state = this.getClientState(client);
    if (!state) return;

    if (state.roomId !== payload.roomId) {
      client.emit('error', { message: 'Not in this battle' });
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
    this.logger.log(`Client reconnected: ${payload.playerId}`);

    const room = this.rooms.get(payload.roomId);
    if (room) {
      existingState.roomId = payload.roomId;
      client.emit('reconnected', { roomId: payload.roomId, status: room.getStatus() });
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

    for (const [pid, state] of this.clients.entries()) {
      if (state.roomId === roomId) {
        state.roomId = null;
        const timer = this.disconnectTimers.get(pid);
        if (timer) {
          clearTimeout(timer);
          this.disconnectTimers.delete(pid);
        }
      }
    }

    this.rooms.delete(roomId);
    this.logger.log(`Room cleaned up: ${roomId}`);
  }
}
