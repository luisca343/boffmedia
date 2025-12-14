import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { MILLIONAIRE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IMillionaireRepository } from '../repositories/interfaces/millionaire.repository.interface';

@Injectable()
export class SessionService {
  constructor(
    @Inject(MILLIONAIRE_REPOSITORY_TOKEN)
    private readonly millionaireRepository: IMillionaireRepository,
  ) {}

  async createSession(conductorUuid: string): Promise<{ sessionId: number; sessionCode: string }> {
    if (!conductorUuid) {
      throw new BadRequestException('Conductor UUID is required');
    }

    return await this.millionaireRepository.createSession({
      conductorUuid
    });
  }

  async getSession(sessionId: number): Promise<any> {
    const session = await this.millionaireRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Parse JSON fields
    session.lifelinesRemaining = JSON.parse(session.lifelinesRemaining);
    return session;
  }

  async getSessionByCode(sessionCode: string): Promise<any> {
    const session = await this.millionaireRepository.findSessionByCode(sessionCode);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.lifelinesRemaining = JSON.parse(session.lifelinesRemaining);
    return session;
  }

  async updateStatus(sessionId: number, status: string): Promise<void> {
    const validStatuses = ['WAITING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid session status');
    }

    const updated = await this.millionaireRepository.updateSessionStatus(sessionId, status);
    if (!updated) {
      throw new NotFoundException('Session not found');
    }
  }

  async advanceToNextQuestion(sessionId: number): Promise<boolean> {
    return await this.millionaireRepository.advanceQuestion(sessionId);
  }

  async updatePrizeMoney(sessionId: number, amount: string): Promise<void> {
    await this.millionaireRepository.updatePrizeMoney(sessionId, amount);
  }

  async addPlayer(sessionId: number, uuid: string, name: string): Promise<number> {
    // Check if session exists and is in valid state
    const session = await this.getSession(sessionId);
    if (session.status !== 'WAITING' && session.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot join this session');
    }

    // Check if player already exists
    const existingPlayer = await this.millionaireRepository.findPlayerByUuid(sessionId, uuid);
    if (existingPlayer) {
      // Update connection status
      await this.millionaireRepository.updatePlayerConnection(existingPlayer.id, 'CONNECTED');
      return existingPlayer.id;
    }

    return await this.millionaireRepository.addPlayer(sessionId, uuid, name);
  }
}
