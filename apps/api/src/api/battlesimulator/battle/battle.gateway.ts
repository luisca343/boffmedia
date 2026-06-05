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
import { MatchmakingService } from './matchmaking.service';

interface ClientState {
  socket: Socket;
  roomIds: Map<string, 'p1' | 'p2'>;
  playerId: string;
}

interface PendingChallenge {
  from: string;
  to: string;
  format: string;
  timestamp: number;
}

@WebSocketGateway({ namespace: '/battle', cors: true })
export class BattleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly logger: Logger,
    private readonly achievementFacade: AchievementFacadeService,
    private readonly matchmaking: MatchmakingService,
  ) {}

  @WebSocketServer() server: Server;

  private clients: Map<string, ClientState> = new Map();
  private rooms: Map<string, BattleRoom> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private pendingChallenges: Map<string, PendingChallenge> = new Map();

  private readonly RECONNECT_GRACE_MS = 30_000;

  handleConnection(_client: Socket) {
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
      roomIds: new Map(),
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
        for (const [roomId, side] of state.roomIds.entries()) {
          const room = this.rooms.get(roomId);
          if (room && room.getStatus() === 'active') {
            room.forfeit(side);
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
      onRequestP1: (request: Protocol.Request) => {
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
    state.roomIds.set(roomId, 'p1');

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

    const side = state.roomIds.get(payload.roomId);
    if (!side) {
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

    room.playerChoice(payload.choice, side);
  }

  @SubscribeMessage('forfeit')
  handleForfeit(client: Socket, payload: { roomId: string }): void {
    const state = this.getClientState(client);
    if (!state) return;

    const side = state.roomIds.get(payload.roomId);
    if (!side) {
      client.emit('error', {
        roomId: payload.roomId,
        message: 'Not in this battle',
      });
      return;
    }

    const room = this.rooms.get(payload.roomId);
    if (room && room.getStatus() === 'active') {
      room.forfeit(side);
    }
  }

  @SubscribeMessage('spectate')
  handleSpectate(client: Socket, payload: { roomId: string }): void {
    const room = this.rooms.get(payload.roomId);
    if (!room) {
      client.emit('error', { message: 'Battle not found' });
      return;
    }

    const state = this.getClientState(client);
    const side = state?.roomIds.get(payload.roomId);

    client.emit('spectateJoined', {
      roomId: payload.roomId,
      replay: room.getReplay(),
      status: room.getStatus(),
      currentRequest: side ? room.getCurrentRequest(side) : null,
    });
  }

  // ─── Matchmaking Events ───

  @SubscribeMessage('joinQueue')
  handleJoinQueue(client: Socket, payload: { format?: string }): void {
    const state = this.getClientState(client);
    if (!state) return;

    const format = payload?.format || 'gen9randombattle';

    // Check if already in a battle
    if (state.roomIds.size > 0) {
      client.emit('error', { message: 'You are already in a battle' });
      return;
    }

    const result = this.matchmaking.joinQueue({
      playerId: state.playerId,
      socketId: client.id,
      format,
      joinedAt: Date.now(),
    });

    if (result) {
      // Match found — create PvP room
      this.createPvPRoom(result.player1, result.player2, result.format);
    } else {
      client.emit('queueJoined', {
        format,
        position: this.matchmaking.getQueueSize(format),
      });
    }
  }

  @SubscribeMessage('leaveQueue')
  handleLeaveQueue(client: Socket): void {
    const state = this.getClientState(client);
    if (!state) return;

    this.matchmaking.leaveQueue(state.playerId);
    client.emit('queueLeft');
  }

  @SubscribeMessage('getQueueStatus')
  handleGetQueueStatus(client: Socket): void {
    client.emit('queueStatus', this.matchmaking.getAllQueueSizes());
  }

  // ─── Challenge Events ───

  @SubscribeMessage('challengePlayer')
  handleChallengePlayer(
    client: Socket,
    payload: { targetPlayerId: string; format?: string },
  ): void {
    const state = this.getClientState(client);
    if (!state) return;

    const target = this.clients.get(payload.targetPlayerId);
    if (!target) {
      client.emit('error', { message: 'Player not found' });
      return;
    }

    if (target.playerId === state.playerId) {
      client.emit('error', { message: 'Cannot challenge yourself' });
      return;
    }

    const format = payload?.format || 'gen9randombattle';
    const challengeKey = `${state.playerId}:${target.playerId}`;

    this.pendingChallenges.set(challengeKey, {
      from: state.playerId,
      to: target.playerId,
      format,
      timestamp: Date.now(),
    });

    target.socket.emit('challengeReceived', {
      from: state.playerId,
      format,
    });

    client.emit('challengeSent', { to: target.playerId, format });
  }

  @SubscribeMessage('acceptChallenge')
  handleAcceptChallenge(
    client: Socket,
    payload: { fromPlayerId: string },
  ): void {
    const state = this.getClientState(client);
    if (!state) return;

    const challengeKey = `${payload.fromPlayerId}:${state.playerId}`;
    const challenge = this.pendingChallenges.get(challengeKey);

    if (!challenge) {
      client.emit('error', { message: 'Challenge not found or expired' });
      return;
    }

    this.pendingChallenges.delete(challengeKey);

    const challenger = this.clients.get(payload.fromPlayerId);
    if (!challenger) {
      client.emit('error', { message: 'Challenger is no longer online' });
      return;
    }

    // Remove both from queue if they were in one
    this.matchmaking.leaveQueue(challenger.playerId);
    this.matchmaking.leaveQueue(state.playerId);

    this.createPvPRoom(
      {
        playerId: challenger.playerId,
        socketId: challenger.socket.id,
      },
      {
        playerId: state.playerId,
        socketId: client.id,
      },
      challenge.format,
    );
  }

  @SubscribeMessage('rejectChallenge')
  handleRejectChallenge(
    client: Socket,
    payload: { fromPlayerId: string },
  ): void {
    const state = this.getClientState(client);
    if (!state) return;

    const challengeKey = `${payload.fromPlayerId}:${state.playerId}`;
    const challenge = this.pendingChallenges.get(challengeKey);

    if (challenge) {
      this.pendingChallenges.delete(challengeKey);
      const challenger = this.clients.get(payload.fromPlayerId);
      challenger?.socket.emit('challengeRejected', {
        by: state.playerId,
      });
    }
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
      existingState.roomIds.set(payload.roomId, 'p1');
      client.emit('reconnected', {
        roomId: payload.roomId,
        status: room.getStatus(),
      });
    }
  }

  private createPvPRoom(
    p1: { playerId: string; socketId: string },
    p2: { playerId: string; socketId: string },
    format: string,
  ): void {
    const p1Client = this.clients.get(p1.playerId);
    const p2Client = this.clients.get(p2.playerId);

    if (!p1Client || !p2Client) {
      this.logger.error('Cannot create PvP room: player client not found');
      return;
    }

    const roomId = crypto.randomUUID();

    const p1Socket = p1Client.socket;
    const p2Socket = p2Client.socket;

    const callbacks: BattleRoomCallbacks = {
      onProtocol: (line: string) => {
        p1Socket.emit('protocol', { roomId, line });
        p2Socket.emit('protocol', { roomId, line });
      },
      onRequestP1: (request: Protocol.Request) => {
        p1Socket.emit('request', { roomId, request });
      },
      onRequestP2: (request: Protocol.Request) => {
        p2Socket.emit('request', { roomId, request });
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
          this.logger.log(`PvP Replay saved: ${replayId}`);
        } catch (err: any) {
          this.logger.error(`Failed to save PvP replay: ${err.message}`);
        }

        const endPayload = { roomId, ...result, replayId };
        p1Socket.emit('battleEnd', endPayload);
        p2Socket.emit('battleEnd', endPayload);
        this.cleanupRoom(roomId);
      },
      onError: (error: string) => {
        this.logger.error(`PvP Battle error [${roomId}]: ${error}`);
        p1Socket.emit('error', { roomId, message: error });
        p2Socket.emit('error', { roomId, message: error });
      },
      onTimerUpdate: (timerState) => {
        const payload = { roomId, ...timerState };
        p1Socket.emit('timerUpdate', payload);
        p2Socket.emit('timerUpdate', payload);
      },
    };

    const room = new BattleRoom(
      roomId,
      callbacks,
      this.logger,
      undefined,
      'pvp',
    );
    this.rooms.set(roomId, room);
    p1Client.roomIds.set(roomId, 'p1');
    p2Client.roomIds.set(roomId, 'p2');

    room
      .create(format)
      .then(() => {
        const battlePayload = { roomId, format, mode: 'pvp' as const };
        p1Socket.emit('battleCreated', { ...battlePayload, side: 'p1' });
        p2Socket.emit('battleCreated', { ...battlePayload, side: 'p2' });
      })
      .catch((err) => {
        this.logger.error(`Failed to create PvP battle: ${err.message}`);
        p1Socket.emit('error', {
          roomId,
          message: `Failed to create battle: ${err.message}`,
        });
        p2Socket.emit('error', {
          roomId,
          message: `Failed to create battle: ${err.message}`,
        });
        this.cleanupRoom(roomId);
      });
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
