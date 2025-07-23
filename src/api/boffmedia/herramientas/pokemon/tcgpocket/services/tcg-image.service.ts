import { promises as fs } from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TcgImageService {
  async downloadSetImages(sets: any[]): Promise<void> {
    for (const set of sets) {
      const setImgDir = path.join(process.cwd(), 'public', 'img', 'games', 'tcg', 'sets', set.id);
      await fs.mkdir(setImgDir, { recursive: true });

      // Download logo
      if (set.logo) {
        try {
          const logoUrl = set.logo + '.webp';
          const logoFilename = path.join(setImgDir, 'logo.webp');
          const response = await axios.get(logoUrl, { responseType: 'arraybuffer' });
          await fs.writeFile(logoFilename, response.data);
          // Store path WITHOUT /public prefix
          set.logo_local = `/img/games/tcg/sets/${set.id}/logo.webp`;
        } catch (err) {
          console.warn(`[TCG] Failed to download logo for set ${set.id}:`, err);
          set.logo_local = null;
        }
      }

      // Download symbol
      if (set.symbol) {
        try {
          const symbolUrl = set.symbol + '.webp';
          const symbolFilename = path.join(setImgDir, 'symbol.webp');
          const response = await axios.get(symbolUrl, { responseType: 'arraybuffer' });
          await fs.writeFile(symbolFilename, response.data);
          // Store path WITHOUT /public prefix
          set.symbol_local = `/img/games/tcg/sets/${set.id}/symbol.webp`;
        } catch (err) {
          console.warn(`[TCG] Failed to download symbol for set ${set.id}:`, err);
          set.symbol_local = null;
        }
      }
    }
  }

  async downloadCardImage(cardData: any, cardId: string, setId: string, locale: string): Promise<string | null> {
    if (!cardData.image) return null;

    try {
      const cardImgDir = path.join(process.cwd(), 'public', 'img', 'games', 'tcg', 'cards', setId);
      await fs.mkdir(cardImgDir, { recursive: true });

      const imageUrl = cardData.image + '/high.webp';
      const imageFilename = path.join(cardImgDir, `${cardId}_${locale}.webp`);
      
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await fs.writeFile(imageFilename, response.data);
      
      return `/img/games/tcg/cards/${setId}/${cardId}_${locale}.webp`;
    } catch (err) {
      console.warn(`[TCG] Failed to download ${locale} image for card ${cardId}:`, err);
      return null;
    }
  }

  async downloadCardImageIfNotExists(
    cardData: any, 
    cardId: string, 
    setId: string, 
    locale: string, 
    existingImagePath?: string
  ): Promise<string | null> {
    // If image already exists in DB, return it
    if (existingImagePath) {
      console.log(`[TCG] ${locale.toUpperCase()} image for card ${cardId} already exists: ${existingImagePath}`);
      return existingImagePath;
    }

    // Download new image
    const imagePath = await this.downloadCardImage(cardData, cardId, setId, locale);
    if (imagePath) {
      console.log(`[TCG] ${locale.toUpperCase()} image downloaded for card ${cardId}: ${imagePath}`);
    }
    
    return imagePath;
  }

  async downloadImagesForCards(cards: any[], setId: string, existingCardsMap?: Map<string, any>): Promise<void> {
    for (const card of cards) {
      const existingCard = existingCardsMap?.get(card.id);

      // Download EN image if not exists
      if (!card.image_local_en) {
        card.image_local_en = await this.downloadCardImageIfNotExists(
          { image: card.image }, 
          card.id, 
          setId, 
          'en', 
          existingCard?.image_local_en
        );
      }

      // Download ES image if not exists
      if (!card.image_local_es) {
        card.image_local_es = await this.downloadCardImageIfNotExists(
          { image: card.image }, 
          card.id, 
          setId, 
          'es', 
          existingCard?.image_local_es
        );
      }
    }
  }
}