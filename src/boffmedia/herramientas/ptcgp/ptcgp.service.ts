import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ConfigService } from '@/config.service';

@Injectable()
export class PtcgpService {
  private readonly logger = new Logger(PtcgpService.name);
  private readonly subdir = 'ptgcp';
  private readonly baseUrl = 'https://www.serebii.net';

  constructor(private configService: ConfigService) {}

  async getSets(): Promise<any> {
    const sets = await this.configService.readDataFile(this.subdir, 'detailed_sets.json');
    if (sets && false) {
      this.logger.log('Detailed sets found in file, returning from cache');
      return sets;
    }
    this.logger.log('Detailed sets not found in file, fetching from Serebii');
    const basicSets = await this.fetchSets();
    const detailedSets = await this.fetchDetailedSets(basicSets);
    await this.configService.writeDataFile(this.subdir, 'detailed_sets.json', detailedSets);
    return detailedSets;
  }

  private async fetchSets(): Promise<any> {
    const url = 'https://www.serebii.net/tcgpocket/sets.shtml';
    
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      const result = {};
      let currentSection = null;

      $('h2, table').each((index, element) => {
        if (element.tagName === 'h2') {
          currentSection = $(element).text().trim();
          result[currentSection] = [];
        } else if (element.tagName === 'table' && currentSection) {
          $(element).find('tr').slice(1).each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 4) {
              const packData = {
                logo: $(cells[0]).find('img').attr('src') || '',
                icon: $(cells[1]).find('img').attr('src') || '',
                setName: $(cells[2]).text().trim(),
                numberOfCards: $(cells[3]).text().trim(),
                releaseDate: cells.length >= 5 ? $(cells[4]).text().trim() : 'N/A',
              };
              
              // Convert relative URLs to absolute URLs
              if (packData.logo && !packData.logo.startsWith('http')) {
                packData.logo = `https://www.serebii.net${packData.logo}`;
              }
              if (packData.icon && !packData.icon.startsWith('http')) {
                packData.icon = `https://www.serebii.net${packData.icon}`;
              }

              // Only add non-empty sets
              if (packData.setName) {
                result[currentSection].push(packData);
              }
            }
          });
        }
      });

      // Remove empty sections
      Object.keys(result).forEach(key => {
        if (result[key].length === 0) {
          delete result[key];
        }
      });

      return result;
    } catch (error) {
      this.logger.error('Error scraping Serebii:', error);
      throw new Error('Failed to scrape data from Serebii');
    }
  }

  private async fetchDetailedSets(basicSets: any): Promise<any> {
    const detailedSets: any = {};

    for (const [section, sets] of Object.entries(basicSets)) {
      detailedSets[section] = [];

      for (const set of sets as any[]) {
        const setName = set.setName.toLowerCase().replace(/\s+/g, '');
        const url = `${this.baseUrl}/tcgpocket/${setName}/`;

        try {
          const response = await axios.get(url);
          const $ = cheerio.load(response.data);

          const detailedSet = {
            ...set,
            boosterPackList: await this.scrapeBoosterPackList($, setName),
            cardList: await this.scrapeCardList($, setName),
            themedCollections: await this.scrapeThemedCollections($, setName),
            emblems: await this.scrapeEmblems($, setName),
            soloBattles: await this.scrapeSoloBattles($, setName),
            featuredCards: await this.scrapeFeaturedCards($, setName),
          };

          detailedSets[section].push(detailedSet);
        } catch (error) {
          this.logger.error(`Error scraping detailed info for set ${setName}:`, error);
        }
      }
    }

    return detailedSets;
  }

  private async scrapeBoosterPackList($: cheerio.CheerioAPI, setName: string): Promise<any[]> {
    const boosterPacks: any[] = [];
    const packNames = $('h2:contains("Booster Pack List")').nextAll('table').first().find('tr:first-child td').map((_, el) => $(el).text().trim()).get();
    const packImages = $('h2:contains("Booster Pack List")').nextAll('table').first().find('tr:nth-child(2) td img').map((_, el) => $(el).attr('src')).get();
    const packFullNames = $('h2:contains("Booster Pack List")').nextAll('table').first().find('tr:nth-child(3) td').map((_, el) => $(el).text().trim()).get();

    for (let i = 0; i < packNames.length; i++) {
      const imageUrl = packImages[i] ? this.fixImageUrl(packImages[i], setName) : '';
      let localImagePath = '';
      if (imageUrl) {
        localImagePath = await this.saveImage(imageUrl);
      }
      boosterPacks.push({
        packName: packNames[i],
        image: localImagePath,
        fullName: packFullNames[i]
      });
    }

    return boosterPacks;
  }

  private async scrapeThemedCollections($: cheerio.CheerioAPI, setName: string): Promise<any[]> {
    const collections: any[] = [];
    const rows = $('h2:contains("Themed Collections")').nextAll('table').first().find('tr').slice(1).get();

    for (const row of rows) {
      const cells = $(row).find('td');
      const image = cells.eq(0).find('img').attr('src');
      
      const requirements = cells.eq(2).html()?.split('<br>')
        .map(req => this.formatRequirement(cheerio.load(req).text()))
        .filter(Boolean) || [];

      const rewards = cells.eq(3).html()?.split('<br>')
        .map(reward => cheerio.load(reward).text().trim())
        .filter(Boolean) || [];

      const imageUrl = image ? this.fixImageUrl(image, setName) : '';
      let localImagePath = '';
      if (imageUrl) {
        localImagePath = await this.saveImage(imageUrl);
      }

      collections.push({
        picture: localImagePath,
        name: cells.eq(1).text().trim(),
        requirements,
        rewards,
      });
    }

    return collections;
  }

  private formatRequirement(req: string): string {
    const cleaned = req.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const match = cleaned.match(/^(\d+)\s+(.+)$/);
    if (match) {
      return `${match[2]} (#${match[1]})`;
    }
    return cleaned;
  }


  private async scrapeCardList($: cheerio.CheerioAPI, setName: string): Promise<any[]> {
    const cards: any[] = [];
    const cardListTable = $('h2:contains("Card List")').nextAll('table').first();
    const rows = cardListTable.find('> tbody > tr').get();
    
    this.logger.debug(`Found ${rows.length} rows in the Card List table for ${setName}`);
    let cardNumber = 1;
    for (const [index, row] of rows.entries()) {
      const cells = $(row).children('td');
      cardNumber = index + 1;
      const firstCellContent = cells.eq(0).html() || '';
      const numberMatch = firstCellContent.match(/(\d+)\s*\/\s*(\d+)/);
      const number = numberMatch ? numberMatch[1] : null;
      const fullNumber = numberMatch ? numberMatch[0] : 'N/A';
      
      const rarityImg = cells.eq(0).find('img').attr('src');
      const rarity = rarityImg ? rarityImg.split('/').pop()?.split('.')[0] || 'unknown' : 'unknown';

      const image = cells.eq(1).find('img').attr('src');
      const imageUrl = image ? this.fixImageUrl(image, setName) : '';
      let localImagePath = '';

      /*
      if (imageUrl) {
        localImagePath = await this.saveImage(imageUrl);
      }*/

      const name = cells.eq(2).text().trim();
      
      const typeAndStats = cells.eq(3).find('table').find('tr');
      const typeImg = typeAndStats.eq(0).find('img').attr('src');
      const type = typeImg ? this.fixImageUrl(typeImg, '').split('/').pop()?.split('.')[0] || 'unknown' : 'unknown';
      const hpText = typeAndStats.eq(0).text().trim().replace('HP', '');
      const hp = hpText ? parseInt(hpText, 10) : null;
      
      const weaknessImg = typeAndStats.eq(2).find('td').eq(0).find('img').attr('src');
      const weakness = weaknessImg ? this.fixImageUrl(weaknessImg, '').split('/').pop()?.split('.')[0] || 'none' : 'none';
      const weaknessValueText = typeAndStats.eq(2).find('td').eq(0).text().trim().replace('+', '');
      const weaknessValue = weaknessValueText ? parseInt(weaknessValueText, 10) : null;
      
      const retreatCost = typeAndStats.eq(2).find('td').eq(1).find('img').length || 0;
      const packImgs = cells.eq(4).find('img');
      const packNames = packImgs.map((i, img) => {
        const src = $(img).attr('src');
        return src ? this.fixImageUrl(src, '').split('/').pop()?.split('.')[0] || 'unknown' : 'unknown';
      }).get();
      

      // Download the card image
      const cardImageUrl = `${this.baseUrl}/tcgpocket/${setName}/${cardNumber}.jpg`;
      const cardImagePath = await this.saveCardImage(cardImageUrl, setName, cardNumber);

      cards.push({
        cardNumber,
        fullNumber,
        image: cardImagePath,
        name: name || 'Unknown',
        type,
        hp,
        weakness,
        weaknessValue,
        retreatCost,
        packs: packNames,
        rarity,
      });
    }

    this.logger.debug(`Scraped ${cards.length} cards from ${setName}`);
    return cards;
  }

  private async scrapeEmblems($: cheerio.CheerioAPI, setName: string): Promise<any[]> {
    const emblems: any[] = [];
    const rows = $('h2:contains("Emblems")').nextAll('table').first().find('tr').get();
    
    if (rows.length >= 3) {
      const names = $(rows[0]).find('td').map((_, cell) => $(cell).text().trim()).get();
      const images = $(rows[1]).find('td img').map((_, img) => $(img).attr('src')).get();
      const methods = $(rows[2]).find('td').map((_, cell) => $(cell).text().replace('Method', '').trim()).get();

      for (let i = 0; i < names.length; i++) {
        const imageUrl = images[i] ? this.fixImageUrl(images[i], setName) : '';
        let localImagePath = '';
        if (imageUrl) {
          localImagePath = await this.saveImage(imageUrl);
        }
        emblems.push({
          name: names[i],
          image: localImagePath,
          method: methods[i],
        });
      }
    }

    return emblems;
  }

  private async scrapeSoloBattles($: cheerio.CheerioAPI, setName: string): Promise<any[]> {
    const soloBattles: any[] = [];
    const rows = $('h2:contains("Solo Battles")').nextAll('table').first().find('tr').slice(1).get();

    for (const row of rows) {
      const cells = $(row).find('td');
      const image = cells.eq(0).find('img').attr('src');
      const imageUrl = image ? this.fixImageUrl(image, setName) : '';
      let localImagePath = '';
      if (imageUrl) {
        localImagePath = await this.saveImage(imageUrl);
      }
      soloBattles.push({
        image: localImagePath,
        name: cells.eq(1).text().trim(),
      });
    }

    return soloBattles;
  }

  private async scrapeFeaturedCards($: cheerio.CheerioAPI, setName: string): Promise<any[]> {
    const featuredCards: any[] = [];
    const rows = $('table.tab').find('tr').get();
    
    if (rows.length >= 2) {
      const names = $(rows[0]).find('td').map((_, cell) => $(cell).text().trim()).get();
      const images = $(rows[1]).find('td img').map((_, img) => $(img).attr('src')).get();

      for (let i = 0; i < names.length; i++) {
        const imageUrl = images[i] ? this.fixImageUrl(images[i], setName) : '';
        let localImagePath = '';
        if (imageUrl) {
          localImagePath = await this.saveImage(imageUrl);
        }
        featuredCards.push({
          name: names[i],
          image: localImagePath,
        });
      }
    }

    return featuredCards;
  }

  private fixImageUrl(imagePath: string, setName: string): string {
    const cleanPath = imagePath.replace(/^\/+/, '');
    const parts = cleanPath.split('/');
    
    // Remove 'tcgpocket' if it appears twice
    if (parts[0] === 'tcgpocket' && parts[1] === 'tcgpocket') {
      parts.splice(1, 1);
    }
    
    // Only include the set name for specific images (not for type icons, etc.)
    if (setName && !parts.includes('image') && !parts.includes(setName)) {
      parts.unshift(setName);
    }
    
    // Ensure 'tcgpocket' is always present
    if (!parts.includes('tcgpocket')) {
      parts.unshift('tcgpocket');
    }
    
    return `${this.baseUrl}/${parts.join('/')}`;
  }

  private async saveImage(imageUrl: string): Promise<string> {
    const urlParts = new URL(imageUrl);
    const localPath = urlParts.pathname;
    
    if (await this.configService.imageExists(localPath)) {
      this.logger.debug(`Image already exists: ${localPath}`);
      return localPath;
    }

    this.logger.debug(`Downloading image: ${imageUrl}`);
    return this.configService.saveImageFromUrl(imageUrl, localPath);
  }

  private async saveCardImage(imageUrl: string, setName: string, cardNumber: number): Promise<string> {
    const localPath = `/tcgpocket/cards/${setName}/${cardNumber}.jpg`;
    
    if (await this.configService.imageExists(localPath)) {
      this.logger.debug(`Card image already exists: ${localPath}`);
      return localPath;
    }

    this.logger.debug(`Downloading card image: ${imageUrl}`);
    this.configService.saveImageFromUrl(imageUrl, localPath);
    return localPath;
  }
}