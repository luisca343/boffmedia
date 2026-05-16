import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PlayerEnergy } from '../entities/player-energy.entity';
import { MINE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IMineRepository } from '../repositories/interfaces/mine.repository.interface';

export interface EnergyStatus {
  energy: number;
  maxEnergy: number;
  lastCharge: Date;
  timeToNextCharge?: number;
}

@Injectable()
export class EnergyService {
  private readonly HOURS_TO_CHARGE = 1;
  private readonly MAX_ENERGY = 10;

  constructor(
    @Inject(MINE_REPOSITORY_TOKEN)
    private readonly mineRepository: IMineRepository,
  ) {}

  async getPlayerEnergy(uuid: string): Promise<EnergyStatus> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    const playerEnergy = await this.mineRepository.findPlayerEnergy(uuid);
    if (!playerEnergy) {
      throw new BadRequestException('Player not found');
    }

    const lastCharge = await this.mineRepository.findPlayerLastCharge(uuid);
    if (!lastCharge) {
      throw new BadRequestException('Player energy data not found');
    }

    const currentEnergy = playerEnergy.energy;

    // If already at max energy, return current state
    if (currentEnergy >= this.MAX_ENERGY) {
      return {
        energy: this.MAX_ENERGY,
        maxEnergy: this.MAX_ENERGY,
        lastCharge,
        timeToNextCharge: 0,
      };
    }

    // Calculate energy regeneration
    const now = new Date();
    const timeDiff = now.getTime() - lastCharge.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    const extraEnergy = Math.floor(hoursDiff / this.HOURS_TO_CHARGE);
    let newEnergy = currentEnergy + extraEnergy;

    if (newEnergy > this.MAX_ENERGY) {
      newEnergy = this.MAX_ENERGY;
    }

    // Update energy if it has increased
    if (newEnergy > currentEnergy) {
      const newLastCharge = new Date(
        lastCharge.getTime() +
          extraEnergy * this.HOURS_TO_CHARGE * 60 * 60 * 1000,
      );
      await this.mineRepository.updatePlayerEnergy(
        uuid,
        newEnergy,
        newLastCharge,
      );
    }

    // Calculate time to next charge
    const timeToNextCharge =
      newEnergy < this.MAX_ENERGY
        ? this.HOURS_TO_CHARGE * 60 * 60 * 1000 -
          (timeDiff % (this.HOURS_TO_CHARGE * 60 * 60 * 1000))
        : 0;

    return {
      energy: newEnergy,
      maxEnergy: this.MAX_ENERGY,
      lastCharge,
      timeToNextCharge: Math.max(0, timeToNextCharge),
    };
  }

  async consumeEnergy(uuid: string, amount: number = 1): Promise<EnergyStatus> {
    const currentStatus = await this.getPlayerEnergy(uuid);

    if (currentStatus.energy < amount) {
      throw new BadRequestException('Not enough energy');
    }

    const newEnergy = currentStatus.energy - amount;
    await this.mineRepository.updatePlayerEnergy(uuid, newEnergy);

    return {
      ...currentStatus,
      energy: newEnergy,
    };
  }

  async validateEnergyForPlay(uuid: string): Promise<boolean> {
    const energyStatus = await this.getPlayerEnergy(uuid);
    return energyStatus.energy >= 1;
  }
}
