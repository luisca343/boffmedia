import { Injectable } from '@nestjs/common';
import { ParticipantsRepository } from '../../../_repositories/boffmedia/participants.repository';
import { Participant, EventParticipant, Achievement } from '@/_db/schema/Events';
import { JoinEventDto } from '../dto/join-event.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    private readonly participantsRepository: ParticipantsRepository,
  ) {}

  async getOrCreateParticipantByUserId(userId: number): Promise<Participant> {
    // Try to find existing participant
    const existingParticipant = await this.participantsRepository.findByUserId(userId);
    
    if (existingParticipant) {
      return existingParticipant;
    }
    
    // If not found, get user info and create participant
    const user = await this.participantsRepository.findUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Create new participant
    const participantData = {
      userId,
      nickname: user.username,
    };

    const result = await this.participantsRepository.createParticipant(participantData);
    
    return {
      id: result.insertId,
      userId,
      nickname: user.username,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Participant;
  }

  async getParticipantAchievements(participantId: number): Promise<any[]> {
    // Get the progress data from repository
    const progressData = await this.participantsRepository.findParticipantAchievements(participantId);
    
    // Transform to match AchievementWithProgress entity
    return progressData.map(achievement => ({
      // Achievement properties
      id: achievement.id,
      eventId: achievement.eventId || 0,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      points: achievement.points,
      maxProgress: achievement.maxProgress,
      itemType: achievement.itemType,
      category: achievement.category,
      rarity: achievement.rarity,
      order: achievement.order || 0,
      active: 1,
      eventName: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      
      // Progress properties
      currentProgress: achievement.progress || 0,
      isCompleted: 0,
      completedAt: null,
      lastUpdated: new Date()
    }));
  }

  async joinEvent(eventId: number, participantId: number, joinEventDto: JoinEventDto): Promise<EventParticipant> {
    // Check if participant is already in the event
    const existingParticipation = await this.participantsRepository.findEventParticipation(participantId, eventId);
    
    if (existingParticipation) {
      throw new Error('Participant is already registered for this event');
    }

    const participationData = {
      participantId,
      eventId,
      status: 'registered' as const,
      comment: joinEventDto.comment || null,
    };

    const result = await this.participantsRepository.createEventParticipation(participationData);
    return this.participantsRepository.findEventParticipationById(result.insertId);
  }

  async getEventParticipants(eventId: number): Promise<(EventParticipant & { 
    nickname: string, 
    avatar: string,
    userId: number 
  })[]> {
    return this.participantsRepository.findEventParticipants(eventId);
  }

  async leaveEvent(eventId: number, participantId: number): Promise<void> {
    await this.participantsRepository.deleteEventParticipation(eventId, participantId);
  }

  async validateParticipantExists(participantId: number): Promise<boolean> {
    // We can implement this by trying to find by userId if needed
    // For now, we'll assume it exists if we get here
    return true;
  }

  async validateEventParticipation(participantId: number, eventId: number): Promise<boolean> {
    const participation = await this.participantsRepository.findEventParticipation(participantId, eventId);
    return !!participation && participation.status === 'confirmed';
  }
}