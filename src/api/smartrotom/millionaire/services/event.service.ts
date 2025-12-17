import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { MILLIONAIRE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IMillionaireRepository } from '../repositories/interfaces/millionaire.repository.interface';

@Injectable()
export class EventService {
  constructor(
    @Inject(MILLIONAIRE_REPOSITORY_TOKEN)
    private readonly millionaireRepository: IMillionaireRepository,
  ) {}

  async createEvent(conductorUuid: string, title?: string, description?: string, maxParticipants?: number): Promise<{ eventId: number; eventCode: string }> {
    if (!conductorUuid) {
      throw new BadRequestException('Conductor UUID is required');
    }

    return await this.millionaireRepository.createEvent({
      conductorUuid,
      title,
      description,
      maxParticipants
    });
  }

  async getEvent(eventId: number): Promise<any> {
    const event = await this.millionaireRepository.findEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Get millionaire data
    const millData = await this.millionaireRepository.findMillionaireData(eventId);
    if (millData) {
      millData.lifelinesRemaining = JSON.parse(millData.lifelinesRemaining);
    }

    // Get participants
    const participants = await this.millionaireRepository.getEventParticipants(eventId);

    return {
      ...event,
      millionaireData: millData,
      participants
    };
  }

  async getEventByCode(eventCode: string): Promise<any> {
    const event = await this.millionaireRepository.findEventByCode(eventCode);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Get millionaire data
    const millData = await this.millionaireRepository.findMillionaireData(event.id);
    if (millData) {
      millData.lifelinesRemaining = JSON.parse(millData.lifelinesRemaining);
    }

    return {
      ...event,
      millionaireData: millData
    };
  }

  async updateStatus(eventId: number, status: string): Promise<void> {
    const validStatuses = ['WAITING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const updated = await this.millionaireRepository.updateEventStatus(eventId, status);
    if (!updated) {
      throw new NotFoundException('Event not found or could not be updated');
    }
  }

  async advanceToNextQuestion(eventId: number): Promise<boolean> {
    return await this.millionaireRepository.advanceQuestion(eventId);
  }

  async addParticipant(eventId: number, uuid: string, role: string = 'PARTICIPANT'): Promise<number> {
    // Check if event exists and is in valid state
    const event = await this.getEvent(eventId);
    if (event.status !== 'WAITING' && event.status !== 'ACTIVE') {
      throw new BadRequestException('Event is not accepting participants');
    }

    // Check if player already exists
    const existingParticipant = await this.millionaireRepository.findParticipantByUuid(eventId, uuid);
    if (existingParticipant) {
      // Update their connection status
      await this.millionaireRepository.updateParticipantConnection(existingParticipant.id, 'CONNECTED');
      return existingParticipant.id;
    }

    return await this.millionaireRepository.addParticipant(eventId, uuid, role);
  }
}
