import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MillionaireFacadeService } from '../millionaire.facade.service';

@WebSocketGateway(34306, {
  cors: {
    origin: '*',
  },
  namespace: '/millionaire',
})
export class MillionaireGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MillionaireGateway.name);
  private sessions: Map<string, Set<string>> = new Map();
  private userSockets: Map<string, { sessionCode: string; role: string; uuid: string }> = new Map();

  constructor(private readonly millionaireFacade: MillionaireFacadeService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    const userData = this.userSockets.get(client.id);
    if (userData) {
      const { sessionCode, role, uuid } = userData;
      
      const sessionSockets = this.sessions.get(sessionCode);
      if (sessionSockets) {
        sessionSockets.delete(client.id);
      }
      
      this.server.to(sessionCode).emit('player:disconnect', { uuid, role });
      this.userSockets.delete(client.id);
    }
  }

  @SubscribeMessage('session:join')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionCode: string; uuid: string; role: 'conductor' | 'player' }
  ) {
    try {
      const { sessionCode, uuid, role } = data;

      const session = await this.millionaireFacade.getSessionByCode(sessionCode);
      
      client.join(sessionCode);
      
      if (!this.sessions.has(sessionCode)) {
        this.sessions.set(sessionCode, new Set());
      }
      this.sessions.get(sessionCode)!.add(client.id);
      this.userSockets.set(client.id, { sessionCode, role, uuid });

      this.server.to(sessionCode).emit('player:join', { uuid, role });

      const state = await this.millionaireFacade.getCurrentState(session.id);
      client.emit('state:sync', state);

      return { success: true };
    } catch (error) {
      this.logger.error(`Error joining session: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userData = this.userSockets.get(client.id);
    if (userData) {
      client.emit('heartbeat:ack', { timestamp: Date.now() });
    }
  }

  @SubscribeMessage('game:start')
  async handleGameStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (userData?.role !== 'conductor') {
        throw new Error('Only conductor can start game');
      }

      await this.millionaireFacade.startGame(data.sessionId);
      
      this.server.to(userData.sessionCode).emit('game:started', {
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('question:reveal')
  async handleRevealQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (userData?.role !== 'conductor') {
        throw new Error('Only conductor can reveal questions');
      }

      const question = await this.millionaireFacade.revealNextQuestion(data.sessionId);
      
      this.server.to(userData.sessionCode).emit('question:revealed', question);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('answer:reveal')
  async handleRevealAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number; isCorrect: boolean }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (userData?.role !== 'conductor') {
        throw new Error('Only conductor can reveal answers');
      }

      this.server.to(userData.sessionCode).emit('answer:revealed', {
        isCorrect: data.isCorrect,
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('game:pause')
  async handlePauseGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (userData?.role !== 'conductor') {
        throw new Error('Only conductor can pause game');
      }

      await this.millionaireFacade.updateSessionStatus(data.sessionId, 'PAUSED');
      
      this.server.to(userData.sessionCode).emit('game:paused', {
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('game:resume')
  async handleResumeGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (userData?.role !== 'conductor') {
        throw new Error('Only conductor can resume game');
      }

      await this.millionaireFacade.updateSessionStatus(data.sessionId, 'ACTIVE');
      
      this.server.to(userData.sessionCode).emit('game:resumed', {
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('answer:submit')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number; answerIndex: number }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (userData?.role !== 'player') {
        throw new Error('Only players can submit answers');
      }

      const result = await this.millionaireFacade.submitAnswer({
        sessionId: data.sessionId,
        playerUuid: userData.uuid,
        answerIndex: data.answerIndex
      });

      this.server.to(userData.sessionCode).emit('answer:submitted', {
        playerUuid: userData.uuid,
        answerIndex: data.answerIndex,
        timestamp: Date.now()
      });

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('lifeline:request')
  async handleLifelineRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number; lifelineType: any }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (userData?.role !== 'player') {
        throw new Error('Only players can request lifelines');
      }

      const result = await this.millionaireFacade.useLifeline({
        sessionId: data.sessionId,
        playerUuid: userData.uuid,
        lifelineType: data.lifelineType as any
      });

      this.server.to(userData.sessionCode).emit('lifeline:activated', {
        playerUuid: userData.uuid,
        lifelineType: data.lifelineType,
        result: result.data
      });

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('state:request')
  async handleStateRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number }
  ) {
    try {
      const state = await this.millionaireFacade.getCurrentState(data.sessionId);
      client.emit('state:sync', state);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
