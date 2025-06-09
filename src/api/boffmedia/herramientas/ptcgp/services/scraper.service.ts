import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { PtcgpRepository } from '@api/_repositories/ptcgp.repository';
import { ConfigService } from '@api/config.service';
import * as cheerio from 'cheerio';
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
    private readonly ptcgpRepository: PtcgpRepository,
    private readonly configService: ConfigService
  ) {}

  async getSets(): Promise<any> {
    try {
      const sets = await this.configService.readDataFile(this.subdir, 'sets.json');
      if (sets && false) { // Force refresh for now
        return sets;
      }
      
      this.logger.log('Datos de Serebii no encontrados en caché, iniciando búsqueda...');
      return this.startFetch();
    } catch (error) {
      this.logger.error('Error getting sets:', error);
      throw new Error('Failed to get sets data');
    }
  }

  async scrapeSoloBattles() {
    try {
      this.updateFetchStatus('fetching', 'Scraping solo battles...');
      
      // Implementation for scraping solo battles
      const battleData = await this.fetchBattleData();
      
      this.updateFetchStatus('success', 'Solo battles scraped successfully');
      return battleData;
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
      const basicSets = await this.fetchSets();
      
      // Fetch detailed information for each set
      const detailedSets = await this.fetchDetailedSets(basicSets);
      
      // Save to cache
      await this.configService.writeDataFile(this.subdir, 'sets.json', detailedSets);
      
      // Save to database
      await this.saveToDatabase(detailedSets);
      
      this.updateFetchStatus('success', 'Datos cargados exitosamente');
      return detailedSets;
    } catch (error) {
      this.logger.error('Error during fetch:', error);
      this.updateFetchStatus('error', `Error: ${error.message}`);
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
      
      // Parse sets from the page
      const sets = {};
      
      // Implementation for parsing sets...
      // This would need to be adapted based on the actual HTML structure
      
      return sets;
    } catch (error) {
      this.logger.error('Error fetching sets:', error);
      throw new Error('Failed to fetch sets from Serebii');
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
        }
      }
    }

    return detailedSets;
  }

  private async fetchSetDetails(set: any): Promise<any> {
    // Implementation for fetching detailed set information
    // This would include cards, booster packs, etc.
    return set;
  }

  private async fetchBattleData(): Promise<any> {
    // Implementation for fetching battle data
    return {};
  }

  private async saveToDatabase(setsData: any) {
    try {
      await this.ptcgpRepository.executeTransaction(async (tx) => {
        for (const [sectionName, sets] of Object.entries(setsData)) {
          for (const set of sets as any[]) {
            // Save expansion
            await this.ptcgpRepository.createExpansion({
              id: set.setName.toLowerCase().replace(/\s+/g, '-'),
              name: set.setName,
              logo_url: set.logo || '',
              icon_url: set.icon || '',
              type: sectionName === 'Main Sets' ? 'main' : 'promo',
              release_date: set.releaseDate ? new Date(set.releaseDate) : null,
            });

            // Save booster packs
            if (set.boosterPackList) {
              for (const pack of set.boosterPackList) {
                await this.ptcgpRepository.createBoosterPack({
                  name: pack.packName,
                  expansion: set.setName.toLowerCase().replace(/\s+/g, '-'),
                });
              }
            }

            // Save cards
            if (set.cardList) {
              for (const card of set.cardList) {
                await this.ptcgpRepository.createCard({
                  expansion: set.setName.toLowerCase().replace(/\s+/g, '-'),
                  number: card.cardNumber,
                  name: card.name,
                  rarity: card.rarity,
                  type: card.type,
                  hp: card.hp,
                  weakness: card.weakness,
                  weakness_value: card.weaknessValue,
                  retreat_cost: card.retreatCost,
                });

                // Save card-pack relationships
                if (card.packs) {
                  for (const packName of card.packs) {
                    await this.ptcgpRepository.createCardPack({
                      expansion: set.setName.toLowerCase().replace(/\s+/g, '-'),
                      card_number: card.cardNumber,
                      pack_id: packName,
                    });
                  }
                }
              }
            }
          }
        }
      });
      
      this.logger.log('Data saved to database successfully');
    } catch (error) {
      this.logger.error('Error saving to database:', error);
      throw new Error('Failed to save data to database');
    }
  }

  async getBattleData(battleUrl: string): Promise<BattleData> {
    try {
      this.updateFetchStatus('fetching', 'Scraping battle data...');
      
      const response = await axios.get(battleUrl);
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