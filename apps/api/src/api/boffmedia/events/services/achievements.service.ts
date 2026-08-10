import { Injectable } from '@nestjs/common';
import { AchievementsRepository } from '../../../_repositories/boffmedia/achievements.repository';
import { Achievement } from '@/_db/schema/BoffMediaEvents';
import { CreateEventAchievementDto } from '../dto/create-achievement.dto';
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
    return this.achievementsRepository.findById(id) as Promise<Achievement>;
  }

  async getAchievementsByEventId(eventId: number): Promise<Achievement[]> {
    // Ensure the event exists first
    const eventExists =
      await this.achievementsRepository.checkEventExists(eventId);
    if (!eventExists) {
      return [];
    }

    return this.achievementsRepository.findByEventId(eventId);
  }

  async createAchievement(
    eventId: number,
    createAchievementDto: CreateEventAchievementDto,
  ): Promise<Achievement> {
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

  async updateAchievement(
    id: number,
    updateAchievementDto: UpdateAchievementDto,
  ): Promise<Achievement> {
    // Only the keys actually sent are written: `maxProgress || 1` turned any
    // partial PATCH into a silent reset to 1 (instantly "completing" every
    // in-flight progress row) and `order || 0` dropped the display order.
    const d = updateAchievementDto;
    const achievementData: Partial<Achievement> = {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.icon !== undefined ? { icon: d.icon } : {}),
      ...(d.maxProgress !== undefined ? { maxProgress: d.maxProgress } : {}),
      ...(d.points !== undefined ? { points: d.points } : {}),
      ...(d.itemType !== undefined ? { itemType: d.itemType } : {}),
      ...(d.category !== undefined ? { category: d.category } : {}),
      ...(d.rarity !== undefined ? { rarity: d.rarity } : {}),
      ...(d.order !== undefined ? { order: d.order } : {}),
    };

    await this.achievementsRepository.update(id, achievementData);
    return this.getAchievementById(id);
  }

  async validateAchievementExists(achievementId: number): Promise<boolean> {
    const achievement =
      await this.achievementsRepository.findById(achievementId);
    return !!achievement;
  }

  async validateEventExists(eventId: number): Promise<boolean> {
    return this.achievementsRepository.checkEventExists(eventId);
  }

  async getParticipantProgress(participantId: number): Promise<any[]> {
    return this.achievementsRepository.getParticipantProgress(participantId);
  }

  async getParticipantProgressByEvent(
    participantId: number,
    eventId: number,
  ): Promise<any[]> {
    const eventExists =
      await this.achievementsRepository.checkEventExists(eventId);
    if (!eventExists) {
      return [];
    }

    return this.achievementsRepository.getParticipantProgressByEvent(
      participantId,
      eventId,
    );
  }
}
