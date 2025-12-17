import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MillionaireFacadeService } from '../millionaire.facade.service';

@Injectable()
export class MillionaireSocketService {
  private readonly logger = new Logger(MillionaireSocketService.name);
  private sessions: Map<string, Set<string>> = new Map();
  private userSockets: Map<string, { sessionCode: string; role: string; uuid: string }> = new Map();

  constructor(private readonly millionaireFacade: MillionaireFacadeService) {}

  handleDisconnect(server: Server, client: Socket) {
    const userData = this.userSockets.get(client.id);
    if (userData) {
      const { sessionCode, role, uuid } = userData;
      
      const sessionSockets = this.sessions.get(sessionCode);
      if (sessionSockets) {
        sessionSockets.delete(client.id);
      }
      
      server.to(sessionCode).emit('millionaire:player:disconnect', { uuid, role });
      this.userSockets.delete(client.id);
      this.logger.log(`Millionaire player ${uuid} disconnected from session ${sessionCode}`);
    }
  }

  async handleJoinSession(
    server: Server,
    client: Socket,
    data: { sessionCode: string; uuid: string; role: 'conductor' | 'player' }
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

      server.to(sessionCode).emit('millionaire:player:join', { uuid, role });

      const state = await this.millionaireFacade.getCurrentState(session.id);
      client.emit('millionaire:state:sync', state);

      return { success: true };
    } catch (error) {
      this.logger.error(`Error joining session: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  handleHeartbeat(client: Socket) {
    const userData = this.userSockets.get(client.id);
    if (userData) {
      client.emit('millionaire:heartbeat:ack', { timestamp: Date.now() });
    }
  }

  async handleGameStart(
    server: Server,
    client: Socket,
    data: { sessionId: number }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (userData?.role !== 'conductor') {
        throw new Error('Only conductor can start game');
      }

      await this.millionaireFacade.startGame(data.sessionId);
      
      server.to(userData.sessionCode).emit('millionaire:game:started', {
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleRevealQuestion(
    server: Server,
    client: Socket,
    data: { sessionId: number }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (userData?.role !== 'conductor') {
        throw new Error('Only conductor can reveal questions');
      }

      const question = await this.millionaireFacade.revealNextQuestion(data.sessionId);
      
      server.to(userData.sessionCode).emit('millionaire:question:revealed', question);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleRevealAnswer(
    server: Server,
    client: Socket,
    data: { sessionId: number; isCorrect: boolean }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (userData?.role !== 'conductor') {
        throw new Error('Only conductor can reveal answers');
      }

      server.to(userData.sessionCode).emit('millionaire:answer:revealed', {
        isCorrect: data.isCorrect,
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handlePauseGame(
    server: Server,
    client: Socket,
    data: { sessionId: number }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (userData?.role !== 'conductor') {
        throw new Error('Only conductor can pause game');
      }

      await this.millionaireFacade.updateSessionStatus(data.sessionId, 'PAUSED');
      
      server.to(userData.sessionCode).emit('millionaire:game:paused', {
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleResumeGame(
    server: Server,
    client: Socket,
    data: { sessionId: number }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (userData?.role !== 'conductor') {
        throw new Error('Only conductor can resume game');
      }

      await this.millionaireFacade.updateSessionStatus(data.sessionId, 'ACTIVE');
      
      server.to(userData.sessionCode).emit('millionaire:game:resumed', {
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleSubmitAnswer(
    server: Server,
    client: Socket,
    data: { sessionId: number; answerIndex: number }
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

      server.to(userData.sessionCode).emit('millionaire:answer:submitted', {
        playerUuid: userData.uuid,
        answerIndex: data.answerIndex,
        timestamp: Date.now()
      });

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleLifelineRequest(
    server: Server,
    client: Socket,
    data: { sessionId: number; lifelineType: any }
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

      server.to(userData.sessionCode).emit('millionaire:lifeline:activated', {
        playerUuid: userData.uuid,
        lifelineType: data.lifelineType,
        result: result.data
      });

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleStateRequest(
    server: Server,
    client: Socket,
    data: { sessionId: number }
  ) {
    try {
      const state = await this.millionaireFacade.getCurrentState(data.sessionId);
      client.emit('millionaire:state:sync', state);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
