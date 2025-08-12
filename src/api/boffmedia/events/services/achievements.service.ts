import { Injectable } from '@nestjs/common';
import { AchievementsRepository } from '../../../_repositories/boffmedia/achievements.repository';
import { Achievement } from '@/_db/schema/Events';
import { CreateAchievementDto } from '../dto/create-achievement.dto';
import { UpdateAchievementDto } from '../dto/update-achievement.dto';

@Injectable()
export class AchievementsService {
  constructor(
    private readonly achievementsRepository: AchievementsRepository,
  ) {}

  async getAllAchievements(): Promise<Achievement[]> {
    return this.achievementsRepository.findAll();
  }

  async getAchievementById(id: number): Promise<Achievement> {
    return this.achievementsRepository.findById(id);
  }

  async getAchievementsByEventId(eventId: number): Promise<Achievement[]> {
    // Ensure the event exists first
    const eventExists = await this.achievementsRepository.checkEventExists(eventId);
    if (!eventExists) {
      return [];
    }

    return this.achievementsRepository.findByEventId(eventId);
  }

  async createAchievement(eventId: number, createAchievementDto: CreateAchievementDto): Promise<Achievement> {
    const achievementData = {
      eventId,
      name: createAchievementDto.name,
      description: createAchievementDto.description,
      icon: createAchievementDto.icon,
      maxProgress: createAchievementDto.maxProgress || 1,
      points: createAchievementDto.points,
      itemType: createAchievementDto.itemType,
      category: createAchievementDto.category,
      rarity: createAchievementDto.rarity,
      order: createAchievementDto.order || 0,
    };

    const result = await this.achievementsRepository.create(achievementData);
    return this.getAchievementById(result.insertId);
  }

  async updateAchievement(id: number, updateAchievementDto: UpdateAchievementDto): Promise<Achievement> {
    const achievementData = {
      name: updateAchievementDto.name,
      description: updateAchievementDto.description,
      icon: updateAchievementDto.icon,
      maxProgress: updateAchievementDto.maxProgress || 1,
      points: updateAchievementDto.points,
      category: updateAchievementDto.category,
      rarity: updateAchievementDto.rarity,
      order: updateAchievementDto.order || 0,
    };

    await this.achievementsRepository.update(id, achievementData);
    return this.getAchievementById(id);
  }

  async validateAchievementExists(achievementId: number): Promise<boolean> {
    const achievement = await this.achievementsRepository.findById(achievementId);
    return !!achievement;
  }

  async validateEventExists(eventId: number): Promise<boolean> {
    return this.achievementsRepository.checkEventExists(eventId);
  }

  async getParticipantProgress(participantId: number): Promise<any[]> {
    return this.achievementsRepository.getParticipantProgress(participantId);
  }

  async getParticipantProgressByEvent(participantId: number, eventId: number): Promise<any[]> {
    const eventExists = await this.achievementsRepository.checkEventExists(eventId);
    if (!eventExists) {
      return [];
    }

    return this.achievementsRepository.getParticipantProgressByEvent(participantId, eventId);
  }
}