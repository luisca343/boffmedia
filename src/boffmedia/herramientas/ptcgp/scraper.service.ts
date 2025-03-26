import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ConfigService } from '@/config.service';
import { Observable, Subject } from 'rxjs';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { tcgpBoosterPacks, tcgpCards, tcgpCardsPacks, tcgpExpansions } from '@/_db/schema/TCGP';
import { eq, and } from 'drizzle-orm';

interface FetchStatusData {
  status: 'fetching' | 'success' | 'error';
  message: string;
  timestamp: string;
}

@Injectable()
export class TgcpScraperService {
  private readonly logger = new Logger(TgcpScraperService.name);
  private readonly subdir = 'tcgpocket';
  private readonly baseUrl = 'https://www.serebii.net';
  private fetchStatus = new Subject<FetchStatusData>();

  constructor(
    private db: MySQL2Service,
    private configService: ConfigService
  ) {}


  async getSets(): Promise<any> {
    const sets = await this.configService.readDataFile(this.subdir, 'sets.json');
    if (sets && false) {
      this.logger.log('Datos de Serebii encontrados en caché');
      return sets;
    }
    this.logger.log('Datos de Serebii no encontrados en caché, iniciando búsqueda...');
    return this.startFetch();
  }

  async scrapeSoloBattles(){
    try {
      console.log('Fetching solo battles data from Serebii...');
      const response = await axios.get('https://www.serebii.net/tcgpocket/solobattles.shtml');
      const $ = cheerio.load(response.data);
      
      const soloBattles = {};
      let currentLocation = null;
  
      // Find all location headers and their content
      $('td.fooevo, td.fooinfo').each((_, element) => {
        const $element = $(element);
        
        if ($element.hasClass('fooevo')) {
          const locationName = $element.text().trim();
          if (locationName) {
            currentLocation = locationName;
            soloBattles[currentLocation] = [];
          }
        } else if ($element.hasClass('fooinfo') && currentLocation) {
          // Process each battle within the current location
          $element.find('a').each((_, link) => {
            const $link = $(link);
            const battleName = $link.text().trim();
            const battleUrl = $link.attr('href');
            if (battleName && battleUrl) {
              const battleId = battleUrl.split('/').pop()?.split('.')[0] || '';
              soloBattles[currentLocation].push({
                id: battleId,
                name: battleName,
                url: `https://www.serebii.net/tcgpocket/${battleUrl}`
              });
            }
          });
        }
      });
      
      return soloBattles;
    } catch (error) {
      console.error('Error scraping solo battles:', error);
      throw error;
    }
  }

  

  async startFetch(): Promise<any> {
    this.updateFetchStatus('fetching', 'Cargando datos de Serebii...');
    try {
      const basicSets = await this.fetchSets();
      const detailedSets = await this.fetchDetailedSets(basicSets);
      await this.configService.writeDataFile(this.subdir, 'sets.json', detailedSets);
      this.updateFetchStatus('success', 'Datos de Serebii cargados correctamente');
      return detailedSets;
    } catch (error) {
      this.logger.error('Error al cargar datos de Serebii:', error);
      this.updateFetchStatus('error', 'Error al cargar datos de Serebii');
      throw error;
    }
  }

  getFetchStatus(): Observable<FetchStatusData> {
    return this.fetchStatus.asObservable();
  }

  private updateFetchStatus(status: 'fetching' | 'success' | 'error', message: string) {
    const statusData: FetchStatusData = {
      status,
      message,
      timestamp: new Date().toISOString()
    };
    this.fetchStatus.next(statusData);
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

      console.log(`Scraping detailed info for section ${section}...`);

      const sectionId = section.toLowerCase().replace(/\s+/g, '');

      for (const set of sets as any[]) {
        const setLogo = set.logo;
        const setIcon = set.icon;
        const setName = set.setName;
        const setId = set.setName.toLowerCase().replace(/\s+/g, '');
        const releaseDateStr = set.releaseDate; // October 30th 2024 || N/A
        const releaseDate = null;

        const url = `${this.baseUrl}/tcgpocket/${setId}/`;

        const [existingSet] = await this.db.getDrizzle()
          .select()
          .from(tcgpExpansions)
          .where(eq(tcgpExpansions.id, setId))
          .execute();

        if (!existingSet) {
          await this.db.getDrizzle().insert(tcgpExpansions).values({
            id: setId,
            name: setName,
            logo_url: setLogo,
            icon_url: setIcon,
            type: sectionId,
          }).execute();
          console.log(`Set ${setName} added to the database.`);
        } else {
          // Check if any fields need updating
          const needsUpdate = existingSet.name !== setName ||
                              existingSet.logo_url !== setLogo ||
                              existingSet.icon_url !== setIcon ||
                              existingSet.type !== sectionId;

          if (needsUpdate) {
            await this.db.getDrizzle()
              .update(tcgpExpansions)
              .set({
                name: setName,
                logo_url: setLogo,
                icon_url: setIcon,
                type: sectionId,
              })
              .where(eq(tcgpExpansions.id, setId))
              .execute();
            console.log(`Set ${setName} updated in the database.`);
          } else {
            console.log(`Set ${setName} already exists and is up to date.`);
          }
        }


        try {
          const response = await axios.get(url);
          const $ = cheerio.load(response.data);

          await this.scrapeBoosterPackList($, setId);
          await this.scrapeCardList($, setId);
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
      let localImagePath = 'packs/';
      if (imageUrl) {
        localImagePath = await this.saveImage(imageUrl);
      }

      console.log(`Processing booster pack ${packNames[i]} for set ${setName}`);

      const existingPack = await this.db.getDrizzle()
        .select()
        .from(tcgpBoosterPacks)
        .where(and(
          eq(tcgpBoosterPacks.name, packNames[i]),
          eq(tcgpBoosterPacks.expansion, setName)
        ))
        .execute();

      if (existingPack.length === 0) {
        await this.db.getDrizzle().insert(tcgpBoosterPacks).values({
          name: packNames[i],
          expansion: setName,
        }).execute();
        console.log(`Inserted new booster pack ${packNames[i]} for set ${setName}`);
      } else {
        console.log(`Booster pack ${packNames[i]} for set ${setName} already exists, skipping insertion`);
      }
    }

    return boosterPacks;
  }

  private async scrapeCardList($: cheerio.CheerioAPI, setName: string): Promise<any[]> {
    const cards: any[] = [];
    const cardListTable = $('h2:contains("Card List")').nextAll('table').first();
    const rows = cardListTable.find('> tbody > tr').get();
    
    this.logger.debug(`Found ${rows.length} rows in the Card List table for ${setName}`);
    for (const [index, row] of rows.entries()) {
      if(index === 0) continue;
      const cells = $(row).children('td');
      const firstCellContent = cells.eq(0).html() || '';
      const numberMatch = firstCellContent.match(/(\d+)\s*\/\s*(.+)/);
      const number = numberMatch ? parseInt(numberMatch[1]) : null;
      const fullNumber = numberMatch ? numberMatch[0] : 'N/A';
      
      const rarityImg = cells.eq(0).find('img').attr('src');
      const rarity = rarityImg ? rarityImg.split('/').pop()?.split('.')[0] || 'unknown' : 'unknown';

      const image = cells.eq(1).find('img').attr('src');
      const imageUrl = image ? this.fixImageUrl(image, setName) : '';
      let localImagePath = '';

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
      
      const packIds = packNames.map(name => name.toLowerCase().replace(/\s+/g, ''));

      console.log(`Inserting card ${name} for set ${setName}`);
      console.log(packIds);
      
      // Download the card image
      const cardImageUrl = `${this.baseUrl}/tcgpocket/${setName}/${number}.jpg`;
      const cardImagePath = await this.saveCardImage(cardImageUrl, setName, number);

      const existingCard = await this.db.getDrizzle()
        .select()
        .from(tcgpCards)
        .where(and(eq(tcgpCards.expansion, setName), eq(tcgpCards.number, number)))
        .execute();

      if (existingCard.length === 0) {
        const card = {
          id: `${setName}-${number}`,
          expansion: setName,
          name,
          number,
          rarity,
          type,
          hp,
          weakness,
          weakness_value: weaknessValue,
          retreat_cost: retreatCost,
        } as any;

        const result = await this.db.getDrizzle().insert(tcgpCards).values(card);
        const resultId = result[0].insertId;

        console.log(`New card added: ${name} (${setName}-${number})`);

        for (const packName of packIds) {
          await this.db.getDrizzle().insert(tcgpCardsPacks).values({
            expansion: setName,
            card_number: number,
            pack_id: packName,
          }).execute();
        }
      } else {
        console.log(`Card already exists: ${name} (${setName}-${number})`);
      }
    }

    this.logger.debug(`Scraped ${cards.length} cards from ${setName}`);
    return cards;
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
    if (!parts.includes('tcgpоcket')) {
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
    const localPath = `/games/tcgpocket/cards/${setName}/${cardNumber}.jpg`;
    
    if (await this.configService.imageExists(localPath)) {
      this.logger.debug(`Card image already exists: ${localPath}`);
      return localPath;
    }

    this.logger.debug(`Downloading card image: ${imageUrl}`);
    this.configService.saveImageFromUrl(imageUrl, localPath);
    return localPath;
  }

  
}

