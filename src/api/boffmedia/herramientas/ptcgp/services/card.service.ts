import { Injectable } from '@nestjs/common';
import { PtcgpRepository } from '@api/_repositories/ptcgp.repository';
import { TcgpCard } from '@/_db/schema/TCGP';

@Injectable()
export class CardService {
  constructor(
    private readonly ptcgpRepository: PtcgpRepository,
  ) {}

  async getCards(expansion?: string): Promise<TcgpCard[]> {
    return this.ptcgpRepository.findCards(expansion);
  }

  async getCard(expansion: string, number: number): Promise<TcgpCard | null> {
    if (!expansion || !number) {
      throw new Error('Expansion and card number are required');
    }
    
    return this.ptcgpRepository.findCard(expansion, number);
  }

  async createCard(cardData: Partial<TcgpCard>) {
    if (!cardData.expansion || !cardData.number || !cardData.name) {
      throw new Error('Expansion, number, and name are required');
    }

    // Check if card already exists
    const existingCard = await this.ptcgpRepository.findCard(cardData.expansion, cardData.number);
    if (existingCard) {
      throw new Error(`Card ${cardData.number} already exists in expansion ${cardData.expansion}`);
    }

    return this.ptcgpRepository.createCard(cardData);
  }

  async getCardsByPack(expansion: string, packId: string) {
    if (!expansion || !packId) {
      throw new Error('Expansion and pack ID are required');
    }

    return this.ptcgpRepository.findCardsByPack(expansion, packId);
  }
}