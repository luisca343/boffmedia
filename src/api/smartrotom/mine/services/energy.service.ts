import { Injectable } from '@nestjs/common';
import { MineRepository, PlayerEnergy } from '@repositories/smartrotom/mine.repository';

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
    private readonly mineRepository: MineRepository,
  ) {}

  async getPlayerEnergy(uuid: string): Promise<EnergyStatus> {
    if (!uuid) {
      throw new Error('Player UUID is required');
    }

    const playerEnergy = await this.mineRepository.findPlayerEnergy(uuid);
    if (!playerEnergy) {
      throw new Error('Player not found');
    }

    const lastCharge = await this.mineRepository.findPlayerLastCharge(uuid);
    if (!lastCharge) {
      throw new Error('Player charge data not found');
    }

    let currentEnergy = playerEnergy.energy;

    // If already at max energy, return current state
    if (currentEnergy >= this.MAX_ENERGY) {
      return {
        energy: currentEnergy,
        maxEnergy: this.MAX_ENERGY,
        lastCharge,
        timeToNextCharge: 0
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
      const newChargeTime = new Date(lastCharge.getTime() + (extraEnergy * this.HOURS_TO_CHARGE * 60 * 60 * 1000));
      await this.mineRepository.updatePlayerEnergy(uuid, newEnergy, newChargeTime);
    }

    // Calculate time to next charge
    const timeToNextCharge = newEnergy < this.MAX_ENERGY 
      ? this.HOURS_TO_CHARGE * 60 * 60 * 1000 - (timeDiff % (this.HOURS_TO_CHARGE * 60 * 60 * 1000))
      : 0;

    return {
      energy: newEnergy,
      maxEnergy: this.MAX_ENERGY,
      lastCharge,
      timeToNextCharge
    };
  }

  async consumeEnergy(uuid: string, amount: number = 1): Promise<EnergyStatus> {
    const currentStatus = await this.getPlayerEnergy(uuid);
    
    if (currentStatus.energy < amount) {
      throw new Error('Insufficient energy');
    }

    let newEnergy = currentStatus.energy - amount;
    let newLastCharge = currentStatus.lastCharge;

    // If we were at max energy, start the charge timer
    if (currentStatus.energy >= this.MAX_ENERGY) {
      newLastCharge = new Date();
    }

    await this.mineRepository.updatePlayerEnergy(uuid, newEnergy, newLastCharge);

    return {
      energy: newEnergy,
      maxEnergy: this.MAX_ENERGY,
      lastCharge: newLastCharge
    };
  }

  async validateEnergyForPlay(uuid: string): Promise<boolean> {
    const energyStatus = await this.getPlayerEnergy(uuid);
    return energyStatus.energy >= 1;
  }
}