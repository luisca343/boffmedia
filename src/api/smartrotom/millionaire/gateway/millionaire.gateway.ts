import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MillionaireFacadeService } from '../millionaire.facade.service';

@Injectable()
export class MillionaireSocketService {
  private readonly logger = new Logger(MillionaireSocketService.name);
  private events: Map<string, Set<string>> = new Map(); // eventCode -> Set of socketIds
  private userSockets: Map<string, { eventCode: string; role: string; uuid: string }> = new Map();

  constructor(private readonly millionaireFacade: MillionaireFacadeService) {}

  handleDisconnect(server: Server, client: Socket) {
    const userData = this.userSockets.get(client.id);
    if (userData) {
      const participants = this.events.get(userData.eventCode);
      if (participants) {
        participants.delete(client.id);
        server.to(userData.eventCode).emit('millionaire:participant:left', {
          uuid: userData.uuid,
          role: userData.role
        });
      }
      this.userSockets.delete(client.id);
    }
  }

  async handleJoinEvent(
    server: Server,
    client: Socket,
    data: { eventCode: string; uuid: string; role: 'conductor' | 'player' }
  ) {
    try {
      const event = await this.millionaireFacade.getEventByCode(data.eventCode);
      
      await this.millionaireFacade.joinEvent(data.eventCode, data.uuid);
      
      client.join(data.eventCode);
      
      if (!this.events.has(data.eventCode)) {
        this.events.set(data.eventCode, new Set());
      }
      this.events.get(data.eventCode).add(client.id);
      
      this.userSockets.set(client.id, {
        eventCode: data.eventCode,
        role: data.role,
        uuid: data.uuid
      });
      
      server.to(data.eventCode).emit('millionaire:participant:joined', {
        uuid: data.uuid,
        role: data.role
      });
      
      client.emit('millionaire:joined', { success: true, event });
    } catch (error) {
      this.logger.error(`Failed to join event: ${error.message}`);
      client.emit('millionaire:error', { message: error.message });
    }
  }

  handleHeartbeat(client: Socket) {
    const userData = this.userSockets.get(client.id);
    if (userData) {
      // Update heartbeat in database if needed
    }
  }

  async handleGameStart(
    server: Server,
    client: Socket,
    data: { eventId: number }
  ) {
    try {
      await this.millionaireFacade.startGame(data.eventId);
      
      const userData = this.userSockets.get(client.id);
      if (userData) {
        server.to(userData.eventCode).emit('millionaire:game:started', {
          eventId: data.eventId
        });
      }
    } catch (error) {
      client.emit('millionaire:error', { message: error.message });
    }
  }

  async handleRevealQuestion(
    server: Server,
    client: Socket,
    data: { eventId: number }
  ) {
    try {
      const question = await this.millionaireFacade.revealNextQuestion(data.eventId);
      
      const userData = this.userSockets.get(client.id);
      if (userData) {
        server.to(userData.eventCode).emit('millionaire:question:revealed', { question });
      }
    } catch (error) {
      client.emit('millionaire:error', { message: error.message });
    }
  }

  async handleRevealAnswer(
    server: Server,
    client: Socket,
    data: { eventId: number; isCorrect: boolean }
  ) {
    const userData = this.userSockets.get(client.id);
    if (userData) {
      server.to(userData.eventCode).emit('millionaire:answer:revealed', {
        isCorrect: data.isCorrect
      });
      
      if (!data.isCorrect) {
        await this.millionaireFacade.updateEventStatus(data.eventId, 'COMPLETED');
        server.to(userData.eventCode).emit('millionaire:game:ended', {
          reason: 'incorrect_answer'
        });
      }
    }
  }

  async handlePauseGame(
    server: Server,
    client: Socket,
    data: { eventId: number }
  ) {
    try {
      await this.millionaireFacade.updateEventStatus(data.eventId, 'PAUSED');
      
      const userData = this.userSockets.get(client.id);
      if (userData) {
        server.to(userData.eventCode).emit('millionaire:game:paused');
      }
    } catch (error) {
      client.emit('millionaire:error', { message: error.message });
    }
  }

  async handleResumeGame(
    server: Server,
    client: Socket,
    data: { eventId: number }
  ) {
    try {
      await this.millionaireFacade.updateEventStatus(data.eventId, 'ACTIVE');
      
      const userData = this.userSockets.get(client.id);
      if (userData) {
        server.to(userData.eventCode).emit('millionaire:game:resumed');
      }
    } catch (error) {
      client.emit('millionaire:error', { message: error.message });
    }
  }

  async handleSubmitAnswer(
    server: Server,
    client: Socket,
    data: { eventId: number; answerIndex: number }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (!userData) {
        client.emit('millionaire:error', { message: 'Not connected to event' });
        return;
      }
      
      const result = await this.millionaireFacade.submitAnswer({
        eventId: data.eventId,
        playerUuid: userData.uuid,
        answerIndex: data.answerIndex
      });
      
      server.to(userData.eventCode).emit('millionaire:answer:submitted', {
        playerUuid: userData.uuid,
        isCorrect: result.isCorrect
      });
    } catch (error) {
      client.emit('millionaire:error', { message: error.message });
    }
  }

  async handleLifelineRequest(
    server: Server,
    client: Socket,
    data: { eventId: number; lifelineType: any }
  ) {
    try {
      const userData = this.userSockets.get(client.id);
      if (!userData) {
        client.emit('millionaire:error', { message: 'Not connected to event' });
        return;
      }
      
      const result = await this.millionaireFacade.useLifeline({
        eventId: data.eventId,
        playerUuid: userData.uuid,
        lifelineType: data.lifelineType
      });
      
      server.to(userData.eventCode).emit('millionaire:lifeline:result', {
        lifelineType: data.lifelineType,
        result
      });
    } catch (error) {
      client.emit('millionaire:error', { message: error.message });
    }
  }

  async handleStateRequest(
    server: Server,
    client: Socket,
    data: { eventId: number }
  ) {
    try {
      const state = await this.millionaireFacade.getCurrentState(data.eventId);
      client.emit('millionaire:state:response', state);
    } catch (error) {
      client.emit('millionaire:error', { message: error.message });
    }
  }
}
