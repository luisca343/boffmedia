import { Injectable, Inject, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { PTCGP_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IPtcgpRepository } from '../repositories/interfaces/ptcgp.repository.interface';
import { ConfigService } from '@api/config.service';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

interface FetchStatusData {
  status: 'fetching' | 'success' | 'error';
  message: string;
  timestamp: string;
}

interface CommonReward {
  id: string;
  quantity: string;
}

interface BattleTask {
  mission: string;
  reward: {
    quantity: number;
    id: string;
  }
}

interface DeckCard {
  pack: string;
  cardNumber: number;
  quantity: number;
}

interface Quest {
  name: string;
  deckListing: DeckCard[];
  battleTasks: BattleTask[];
}

export interface BattleData {
  commonRewards: CommonReward[];
  quests: Quest[];
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly subdir = 'tcgpocket';
  private readonly baseUrl = 'https://www.serebii.net';
  private fetchStatus = new Subject<FetchStatusData>();

  constructor(
    @Inject(PTCGP_REPOSITORY_TOKEN) private readonly ptcgpRepository: IPtcgpRepository,
    private readonly configService: ConfigService
  ) {}

  async getSets(): Promise<any> {
    try {
      const sets = await this.configService.readDataFile(this.subdir, 'sets.json');
      if (sets) {
        return sets;
      }
      
      this.logger.log('Datos de Serebii no encontrados en caché, iniciando búsqueda...');
      return await this.startFetch();
    } catch (error) {
      this.logger.error('Error getting sets:', error);
      throw new Error(`Failed to get sets data: ${error.message}`);
    }
  }

  async scrapeSoloBattles() {
    try {
      this.updateFetchStatus('fetching', 'Scraping solo battles...');
      
      const response = await this.fetchWithRetry('https://www.serebii.net/tcgpocket/solobattles.shtml');
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
      
      this.updateFetchStatus('success', 'Solo battles scraped successfully');
      this.logger.log(`Successfully scraped ${Object.keys(soloBattles).length} battle locations`);
      return soloBattles;
    } catch (error) {
      this.logger.error('Error scraping solo battles:', error);
      this.updateFetchStatus('error', 'Failed to scrape solo battles');
      throw error;
    }
  }

  async startFetch(): Promise<any> {
    this.updateFetchStatus('fetching', 'Cargando datos de Serebii...');
    
    try {
      // Fetch basic sets information
      this.updateFetchStatus('fetching', 'Obteniendo información básica de sets...');
      const basicSets = await this.fetchSets();
      
      if (!basicSets || Object.keys(basicSets).length === 0) {
        throw new Error('No se encontraron sets básicos');
      }
      
      this.logger.log(`Found ${Object.keys(basicSets).length} set sections`);
      
      // Fetch detailed information for each set
      this.updateFetchStatus('fetching', 'Obteniendo información detallada de cada set...');
      const detailedSets = await this.fetchDetailedSets(basicSets);
      
      // Validate detailed sets
      if (!detailedSets || Object.keys(detailedSets).length === 0) {
        throw new Error('No se pudo obtener información detallada de los sets');
      }
      
      // Save to cache first (safer operation)
      try {
        this.updateFetchStatus('fetching', 'Guardando en caché...');
        await this.configService.writeDataFile(this.subdir, 'sets.json', detailedSets);
        this.logger.log('Data saved to cache successfully');
      } catch (cacheError) {
        this.logger.warn(`Failed to save to cache: ${cacheError.message}`);
        // Continue anyway as this is not critical
      }
      
      // Save to database
      this.updateFetchStatus('fetching', 'Guardando en base de datos...');
      await this.saveToDatabase(detailedSets);
      
      this.updateFetchStatus('success', 'Datos cargados exitosamente');
      return detailedSets;
    } catch (error) {
      this.logger.error('Error during fetch:', error);
      this.updateFetchStatus('error', `Error: ${error.message}`);
      
      // Try to return cached data if available
      try {
        const cachedSets = await this.configService.readDataFile(this.subdir, 'sets.json');
        if (cachedSets) {
          this.logger.warn('Returning cached data due to fetch failure');
          return cachedSets;
        }
      } catch (cacheError) {
        this.logger.warn('No cached data available');
      }
      
      throw new Error(`Failed to fetch data: ${error.message}`);
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

  private async fetchWithRetry(url: string, maxRetries: number = 3): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`Fetching ${url} (attempt ${attempt}/${maxRetries})`);
        const response = await axios.get(url, { 
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          responseType: url.includes('.jpg') || url.includes('.png') || url.includes('.gif') ? 'arraybuffer' : 'text'
        });
        return response;
      } catch (error) {
        this.logger.warn(`Attempt ${attempt} failed for ${url}: ${error.message}`);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        this.logger.debug(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async fetchSets(): Promise<any> {
    const url = 'https://www.serebii.net/tcgpocket/sets.shtml';
    
    try {
      const response = await this.fetchWithRetry(url);
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

      this.logger.log(`Successfully fetched ${Object.keys(result).length} set sections`);
      return result;
    } catch (error) {
      this.logger.error('Error fetching sets:', error);
      throw new Error(`Failed to fetch sets from Serebii: ${error.message}`);
    }
  }

  private async fetchDetailedSets(basicSets: any): Promise<any> {
    const detailedSets: any = {};

    for (const [section, sets] of Object.entries(basicSets)) {
      detailedSets[section] = [];
      
      for (const set of sets as any[]) {
        try {
          this.updateFetchStatus('fetching', `Fetching details for ${set.setName}...`);
          
          // Fetch detailed information for each set
          const detailedSet = await this.fetchSetDetails(set);
          detailedSets[section].push(detailedSet);
        } catch (error) {
          this.logger.error(`Error fetching details for ${set.setName}:`, error);
          // Continue with other sets even if one fails
          detailedSets[section].push(set);
        }
      }
    }

    return detailedSets;
  }

  private async fetchSetDetails(set: any): Promise<any> {
    const setId = set.setName.toLowerCase().replace(/\s+/g, '-');
    const url = `${this.baseUrl}/tcgpocket/${set.setName.toLowerCase().replace(/\s+/g, '')}/`;

    try {
      const response = await this.fetchWithRetry(url);
      const $ = cheerio.load(response.data);

      const boosterPacks = await this.scrapeBoosterPackList($, setId);
      const cards = await this.scrapeCardList($, setId);

      this.logger.log(`Successfully fetched details for ${set.setName}: ${boosterPacks.length} packs, ${cards.length} cards`);

      return {
        ...set,
        id: setId,
        boosterPackList: boosterPacks,
        cardList: cards
      };
    } catch (error) {
      this.logger.error(`Error fetching details for ${set.setName}:`, error);
      
      // Return basic set data if detailed fetch fails
      return {
        ...set,
        id: setId,
        boosterPackList: [],
        cardList: []
      };
    }
  }

  private async scrapeBoosterPackList($: cheerio.CheerioAPI, setName: string): Promise<any[]> {
    const boosterPacks: any[] = [];
    const packNames = $('h2:contains("Booster Pack List")').nextAll('table').first().find('tr:first-child td').map((_, el) => $(el).text().trim()).get();
    const packImages = $('h2:contains("Booster Pack List")').nextAll('table').first().find('tr:nth-child(2) td img').map((_, el) => $(el).attr('src')).get();
    const packFullNames = $('h2:contains("Booster Pack List")').nextAll('table').first().find('tr:nth-child(3) td').map((_, el) => $(el).text().trim()).get();

    for (let i = 0; i < packNames.length; i++) {
      const imageUrl = packImages[i] ? this.fixImageUrl(packImages[i], setName) : '';
      
      const pack = {
        packName: packNames[i],
        fullName: packFullNames[i] || packNames[i],
        imageUrl,
        setName
      };
      
      boosterPacks.push(pack);
    }

    return boosterPacks;
  }

  private async scrapeCardList($: cheerio.CheerioAPI, setName: string): Promise<any[]> {
    const cards: any[] = [];
    const cardListTable = $('h2:contains("Card List")').nextAll('table').first();
    const rows = cardListTable.find('> tbody > tr').get();
    
    this.logger.debug(`Found ${rows.length} rows in the Card List table for ${setName}`);
    
    for (const [index, row] of rows.entries()) {
      if (index === 0) continue; // Skip header row
      
      const cells = $(row).children('td');
      const firstCellContent = cells.eq(0).html() || '';
      const numberMatch = firstCellContent.match(/(\d+)\s*\/\s*(.+)/);
      const cardNumber = numberMatch ? parseInt(numberMatch[1]) : null;
      const fullNumber = numberMatch ? numberMatch[0] : 'N/A';
      
      const rarityImg = cells.eq(0).find('img').attr('src');
      const rarity = rarityImg ? rarityImg.split('/').pop()?.split('.')[0] || 'unknown' : 'unknown';

      const image = cells.eq(1).find('img').attr('src');
      const imageUrl = image ? this.fixImageUrl(image, setName) : '';

      const name = cells.eq(2).text().trim();
      
      // Parse type and stats
      const typeAndStats = cells.eq(3).find('table').find('tr');
      const typeImg = typeAndStats.eq(0).find('img').attr('src');
      const type = typeImg ? this.fixImageUrl(typeImg, '').split('/').pop()?.split('.')[0] || 'unknown' : 'unknown';
      const hpText = typeAndStats.eq(0).text().trim().replace('HP', '');
      const hp = hpText ? parseInt(hpText, 10) : null;
      
      // Parse weakness
      const weaknessImg = typeAndStats.eq(2).find('td').eq(0).find('img').attr('src');
      const weakness = weaknessImg ? this.fixImageUrl(weaknessImg, '').split('/').pop()?.split('.')[0] || 'none' : 'none';
      const weaknessValueText = typeAndStats.eq(2).find('td').eq(0).text().trim().replace('+', '');
      const weaknessValue = weaknessValueText ? parseInt(weaknessValueText, 10) : null;
      
      // Parse retreat cost
      const retreatCost = typeAndStats.eq(2).find('td').eq(1).find('img').length || 0;
      
      // Parse pack associations
      const packImgs = cells.eq(4).find('img');
      const packNames = packImgs.map((i, img) => {
        const src = $(img).attr('src');
        return src ? this.fixImageUrl(src, '').split('/').pop()?.split('.')[0] || 'unknown' : 'unknown';
      }).get();

      const card = {
        cardNumber,
        fullNumber,
        name,
        rarity,
        type,
        hp,
        weakness,
        weaknessValue,
        retreatCost,
        imageUrl,
        packs: packNames,
        setName
      };

      cards.push(card);
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
    if (!parts.includes('tcgpocket')) {
      parts.unshift('tcgpocket');
    }
    
    return `${this.baseUrl}/${parts.join('/')}`;
  }

  private async saveImage(imageUrl: string): Promise<string> {
    try {
      const response = await this.fetchWithRetry(imageUrl);
      const buffer = Buffer.from(response.data);
      
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      // Create images directory if it doesn't exist
      const imagesDir = path.join(process.cwd(), 'public', 'images', 'tcgpocket');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      
      const filepath = path.join(imagesDir, filename);
      fs.writeFileSync(filepath, buffer);
      
      this.logger.debug(`Saved image: ${filename}`);
      return `/images/tcgpocket/${filename}`;
    } catch (error) {
      this.logger.warn(`Failed to save image ${imageUrl}: ${error.message}`);
      return imageUrl; // Return original URL if save fails
    }
  }

  private async saveCardImage(imageUrl: string, setName: string, cardNumber: number): Promise<string> {
    try {
      const response = await this.fetchWithRetry(imageUrl);
      const buffer = Buffer.from(response.data);
      
      // Create set-specific directory
      const setDir = path.join(process.cwd(), 'public', 'images', 'tcgpocket', 'cards', setName);
      if (!fs.existsSync(setDir)) {
        fs.mkdirSync(setDir, { recursive: true });
      }
      
      // Generate filename with card number
      const extension = imageUrl.split('.').pop() || 'jpg';
      const filename = `${cardNumber.toString().padStart(3, '0')}.${extension}`;
      const filepath = path.join(setDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      
      this.logger.debug(`Saved card image: ${setName}/${filename}`);
      return `/images/tcgpocket/cards/${setName}/${filename}`;
    } catch (error) {
      this.logger.warn(`Failed to save card image ${imageUrl}: ${error.message}`);
      return imageUrl; // Return original URL if save fails
    }
  }

  private async saveSetImage(imageUrl: string, setName: string, imageType: 'logo' | 'icon'): Promise<string> {
    try {
      const response = await this.fetchWithRetry(imageUrl);
      const buffer = Buffer.from(response.data);
      
      // Create set images directory
      const setDir = path.join(process.cwd(), 'public', 'images', 'tcgpocket', 'sets', setName);
      if (!fs.existsSync(setDir)) {
        fs.mkdirSync(setDir, { recursive: true });
      }
      
      const extension = imageUrl.split('.').pop() || 'jpg';
      const filename = `${imageType}.${extension}`;
      const filepath = path.join(setDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      
      this.logger.debug(`Saved set ${imageType}: ${setName}/${filename}`);
      return `/images/tcgpocket/sets/${setName}/${filename}`;
    } catch (error) {
      this.logger.warn(`Failed to save set ${imageType} ${imageUrl}: ${error.message}`);
      return imageUrl; // Return original URL if save fails
    }
  }

  private async savePackImage(imageUrl: string, setName: string, packName: string): Promise<string> {
    try {
      const response = await this.fetchWithRetry(imageUrl);
      const buffer = Buffer.from(response.data);
      
      // Create pack images directory
      const packDir = path.join(process.cwd(), 'public', 'images', 'tcgpocket', 'packs', setName);
      if (!fs.existsSync(packDir)) {
        fs.mkdirSync(packDir, { recursive: true });
      }
      
      const extension = imageUrl.split('.').pop() || 'jpg';
      const safePackName = packName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `${safePackName}.${extension}`;
      const filepath = path.join(packDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      
      this.logger.debug(`Saved pack image: ${setName}/${filename}`);
      return `/images/tcgpocket/packs/${setName}/${filename}`;
    } catch (error) {
      this.logger.warn(`Failed to save pack image ${imageUrl}: ${error.message}`);
      return imageUrl; // Return original URL if save fails
    }
  }

  private async fetchBattleData(): Promise<any> {
    // Implementation for fetching battle data
    return await this.scrapeSoloBattles();
  }

  private async saveToDatabase(setsData: any) {
    try {
      await this.ptcgpRepository.executeTransaction(async (tx) => {
        for (const [sectionName, sets] of Object.entries(setsData)) {
          this.logger.log(`Processing ${sectionName} section with ${(sets as any[]).length} sets`);
          
          for (const set of sets as any[]) {
            try {
              // Parse release date safely
              const releaseDate = this.parseReleaseDate(set.releaseDate);
              const setId = set.id || set.setName.toLowerCase().replace(/\s+/g, '-');

              this.logger.log(`Processing set: ${set.setName} (ID: ${setId})`);

              // Check if expansion already exists before creating
              const existingExpansion = await this.ptcgpRepository.findExpansionById(setId);
              if (!existingExpansion) {
                // Save set images
                const logoUrl = set.logo ? await this.saveSetImage(set.logo, setId, 'logo') : '';
                const iconUrl = set.icon ? await this.saveSetImage(set.icon, setId, 'icon') : '';
                
                await this.ptcgpRepository.createExpansion({
                  id: setId,
                  name: set.setName,
                  logo_url: logoUrl,
                  icon_url: iconUrl,
                  type: sectionName === 'Main Sets' ? 'main' : 'promo',
                  release_date: releaseDate,
                });
                this.logger.log(`Created expansion: ${set.setName}`);
              } else {
                this.logger.log(`Expansion already exists: ${set.setName}`);
              }

              // Save booster packs with duplicate checking and image saving
              if (set.boosterPackList && Array.isArray(set.boosterPackList)) {
                this.logger.log(`Processing ${set.boosterPackList.length} booster packs for ${set.setName}`);
                
                for (const pack of set.boosterPackList) {
                  try {
                    const existingPack = await this.ptcgpRepository.findBoosterPackByName(
                      pack.packName, 
                      setId
                    );
                    
                    if (!existingPack) {
                      // Save pack image
                      const imageUrl = pack.imageUrl ? await this.savePackImage(pack.imageUrl, setId, pack.packName) : '';
                      
                      await this.ptcgpRepository.createBoosterPack({
                        name: pack.packName,
                        expansion: setId,
                        image_url: imageUrl,
                      });
                      this.logger.debug(`Created booster pack: ${pack.packName}`);
                    } else {
                      this.logger.debug(`Booster pack already exists: ${pack.packName}`);
                    }
                  } catch (packError) {
                    this.logger.warn(`Could not save booster pack ${pack.packName}: ${packError.message}`);
                  }
                }
              }

              // Save cards with better validation, duplicate checking, and image saving
              if (set.cardList && Array.isArray(set.cardList)) {
                this.logger.log(`Processing ${set.cardList.length} cards for ${set.setName}`);
                
                for (const card of set.cardList) {
                  try {
                    if (!card.cardNumber || !card.name) {
                      this.logger.warn(`Skipping invalid card: ${JSON.stringify(card)}`);
                      continue;
                    }

                    const existingCard = await this.ptcgpRepository.findCard(setId, card.cardNumber);
                    
                    if (!existingCard) {
                      // Save card image
                      const imageUrl = card.imageUrl ? await this.saveCardImage(card.imageUrl, setId, card.cardNumber) : '';
                      
                      const cardResult = await this.ptcgpRepository.createCard({
                        expansion: setId,
                        number: card.cardNumber,
                        name: card.name,
                        rarity: card.rarity || 'unknown',
                        type: card.type || 'unknown',
                        hp: card.hp || null,
                        weakness: card.weakness === 'none' ? null : card.weakness,
                        weakness_value: card.weaknessValue || null,
                        retreat_cost: card.retreatCost || 0,
                        image_url: imageUrl,
                      });

                      this.logger.debug(`Created card: ${card.name} (${card.cardNumber})`);

                      // Save card-pack relationships
                      if (card.packs && Array.isArray(card.packs)) {
                        for (const packName of card.packs) {
                          try {
                            // Check if relationship already exists
                            const existingRelation = await this.ptcgpRepository.findCardPack(
                              setId, 
                              card.cardNumber, 
                              packName
                            );
                            
                            if (!existingRelation) {
                              await this.ptcgpRepository.createCardPack({
                                expansion: setId,
                                card_number: card.cardNumber,
                                pack_id: packName,
                              });
                              this.logger.debug(`Created card-pack relationship: ${card.name} -> ${packName}`);
                            }
                          } catch (cardPackError) {
                            this.logger.warn(`Could not save card-pack relationship: ${cardPackError.message}`);
                          }
                        }
                      }
                    } else {
                      this.logger.debug(`Card already exists: ${card.name} (${card.cardNumber})`);
                    }
                  } catch (cardError) {
                    this.logger.warn(`Could not save card ${card.name}: ${cardError.message}`);
                  }
                }
              }
            } catch (setError) {
              this.logger.error(`Error processing set ${set.setName}: ${setError.message}`);
              // Continue with other sets even if one fails
            }
          }
        }
      });
      
      this.logger.log('Data and images saved to database successfully');
    } catch (error) {
      this.logger.error('Error saving to database:', error);
      throw new Error(`Failed to save data to database: ${error.message}`);
    }
  }

  private parseReleaseDate(releaseDateStr: string): Date | null {
    if (!releaseDateStr || releaseDateStr === 'N/A') {
      return null;
    }

    try {
      // Handle different date formats from Serebii
      const dateStr = releaseDateStr.trim();
      
      // Check if it's already a valid date format
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
      
      // Try to parse formats like "October 30th 2024"
      const dateMatch = dateStr.match(/(\w+)\s+(\d+)(?:st|nd|rd|th)?\s+(\d{4})/);
      if (dateMatch) {
        const [, month, day, year] = dateMatch;
        return new Date(`${month} ${day}, ${year}`);
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`Could not parse release date: ${releaseDateStr}`);
      return null;
    }
  }

  async getBattleData(battleUrl: string): Promise<BattleData> {
    try {
      this.updateFetchStatus('fetching', 'Scraping battle data...');
      
      const response = await this.fetchWithRetry(battleUrl);
      const $ = cheerio.load(response.data);
      
      // Get common rewards from the first table
      const commonRewards: CommonReward[] = [];
      $('table').first().find('tr').slice(2).each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
          commonRewards.push({
            id: $(cells[0]).text().trim(),
            quantity: $(cells[1]).text().trim()
          });
        }
      });

      // Get individual quests
      const quests: Quest[] = [];
      $('h2').each((_, element) => {
        const questName = $(element).text().trim();
        if (questName && questName !== 'Common Rewards') {
          // Parse quest details...
          const quest: Quest = {
            name: questName,
            deckListing: [], // Parse deck listing
            battleTasks: []  // Parse battle tasks
          };
          quests.push(quest);
        }
      });

      this.updateFetchStatus('success', 'Battle data scraped successfully');
      this.logger.log(`Successfully scraped battle data: ${commonRewards.length} rewards, ${quests.length} quests`);
      
      return {
        commonRewards,
        quests
      };
    } catch (error) {
      this.logger.error('Error scraping battle data:', error);
      this.updateFetchStatus('error', 'Failed to scrape battle data');
      throw new Error(`Failed to scrape battle data: ${error.message}`);
    }
  }
}