import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ParticipantsRepository } from '../../../_repositories/boffmedia/participants.repository';
import {
  PARTICIPANT_STATUS,
  Participant,
  EventParticipant,
} from '@/_db/schema/BoffMediaEvents';
import { JoinEventDto } from '../dto/join-event.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    private readonly participantsRepository: ParticipantsRepository,
  ) {}

  async getOrCreateParticipantByUserId(userId: number): Promise<Participant> {
    // Try to find existing participant
    const existingParticipant =
      await this.participantsRepository.findByUserId(userId);

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

    const result =
      await this.participantsRepository.createParticipant(participantData);

    return {
      id: result.insertId,
      userId,
      nickname: user.username,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Participant;
  }

  async getParticipantAchievements(participantId: number): Promise<any[]> {
    // Get the progress data from repository
    const progressData =
      await this.participantsRepository.findParticipantAchievements(
        participantId,
      );

    // Transform to match AchievementWithProgress entity
    return progressData.map((achievement) => ({
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
      isCompleted: false,
      completedAt: null,
      lastUpdated: new Date(),
    }));
  }

  async joinEvent(
    eventId: number,
    participantId: number,
    joinEventDto: JoinEventDto,
  ): Promise<EventParticipant> {
    // Check if participant is already in the event
    const existingParticipation =
      await this.participantsRepository.findEventParticipation(
        participantId,
        eventId,
      );

    if (existingParticipation) {
      // An admin removal is not something the removed player can undo by
      // re-joining; a self-declined membership is.
      if (existingParticipation.status === PARTICIPANT_STATUS.REMOVED) {
        throw new ForbiddenException(
          'Has sido expulsado de este evento por un administrador',
        );
      }
      if (existingParticipation.status === PARTICIPANT_STATUS.DECLINED) {
        await this.participantsRepository.setEventParticipationStatus(
          eventId,
          participantId,
          PARTICIPANT_STATUS.REGISTERED,
        );
        return this.participantsRepository.findEventParticipationById(
          existingParticipation.id,
        );
      }
      throw new ConflictException(
        'Participant is already registered for this event',
      );
    }

    const participationData = {
      participantId,
      eventId,
      status: 'registered' as const,
      comment: joinEventDto.comment || null,
    };

    const result =
      await this.participantsRepository.createEventParticipation(
        participationData,
      );
    return this.participantsRepository.findEventParticipationById(
      result.insertId,
    );
  }

  async getEventParticipants(eventId: number): Promise<
    (EventParticipant & {
      nickname: string;
      avatar: string;
      userId: number;
    })[]
  > {
    return this.participantsRepository.findEventParticipants(eventId);
  }

  async leaveEvent(eventId: number, participantId: number): Promise<void> {
    await this.participantsRepository.deleteEventParticipation(
      eventId,
      participantId,
    );
  }

  async getParticipationForUser(
    userId: number,
    eventId: number,
  ): Promise<EventParticipant | undefined> {
    return this.participantsRepository.findEventParticipationByUserId(
      userId,
      eventId,
    );
  }

  async setParticipationStatus(
    eventId: number,
    participantId: number,
    status: EventParticipant['status'],
  ): Promise<EventParticipant> {
    const existing = await this.participantsRepository.findEventParticipation(
      participantId,
      eventId,
    );
    if (!existing) {
      throw new NotFoundException('Participation not found');
    }

    await this.participantsRepository.setEventParticipationStatus(
      eventId,
      participantId,
      status,
    );
    return this.participantsRepository.findEventParticipationById(existing.id);
  }

  async validateParticipantExists(_participantId: number): Promise<boolean> {
    // We can implement this by trying to find by userId if needed
    // For now, we'll assume it exists if we get here
    return true;
  }

  async validateEventParticipation(
    participantId: number,
    eventId: number,
  ): Promise<boolean> {
    const participation =
      await this.participantsRepository.findEventParticipation(
        participantId,
        eventId,
      );
    // `registered` counts: nothing in the product ever asks a player to confirm,
    // so a confirmed-only check made every achievement award impossible.
    return (
      !!participation &&
      (participation.status === PARTICIPANT_STATUS.REGISTERED ||
        participation.status === PARTICIPANT_STATUS.CONFIRMED)
    );
  }
}
