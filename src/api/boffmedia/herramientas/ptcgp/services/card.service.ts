import { Injectable, Inject } from '@nestjs/common';
import { PTCGP_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IPtcgpRepository } from '../repositories/interfaces/ptcgp.repository.interface';
import { TcgpCard } from '@/_db/schema/TCGP';

@Injectable()
export class CardService {
  constructor(
    @Inject(PTCGP_REPOSITORY_TOKEN) private readonly ptcgpRepository: IPtcgpRepository,
  ) {}

  async getCards(expansion?: string): Promise<TcgpCard[]> {
    try {
      return await this.ptcgpRepository.findCards(expansion);
    } catch (error) {
      throw new Error(`Failed to get cards: ${error.message}`);
    }
  }

  async getCard(expansion: string, number: number): Promise<TcgpCard | null> {
    if (!expansion || !number) {
      throw new Error('Expansion and card number are required');
    }
    
    try {
      return await this.ptcgpRepository.findCard(expansion, number);
    } catch (error) {
      throw new Error(`Failed to get card: ${error.message}`);
    }
  }

  async createCard(cardData: Partial<TcgpCard>) {
    if (!cardData.expansion || !cardData.number || !cardData.name) {
      throw new Error('Expansion, number, and name are required');
    }

    try {
      // Check if card already exists
      const existingCard = await this.ptcgpRepository.findCard(cardData.expansion, cardData.number);
      if (existingCard) {
        throw new Error(`Card ${cardData.number} already exists in expansion ${cardData.expansion}`);
      }

      return await this.ptcgpRepository.createCard(cardData);
    } catch (error) {
      throw new Error(`Failed to create card: ${error.message}`);
    }
  }

  async getCardsByPack(expansion: string, packId: string) {
    if (!expansion || !packId) {
      throw new Error('Expansion and pack ID are required');
    }

    try {
      return await this.ptcgpRepository.findCardsByPack(expansion, packId);
    } catch (error) {
      throw new Error(`Failed to get cards by pack: ${error.message}`);
    }
  }
}