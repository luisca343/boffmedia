import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

interface BattleData {
  commonRewards: CommonReward[];
  quests: Quest[];
}

@Injectable()
export class PtcgpBattleService {
  async getBattleData(battleUrl: string): Promise<BattleData> {
    try {
      const response = await axios.get(battleUrl);
      const $ = cheerio.load(response.data);
      
      // Get common rewards from the first table
      const commonRewards: CommonReward[] = [];
      $('table').first().find('tr').slice(2).each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 3) {
          const reward: CommonReward = {
            id: $(cells[1]).text().trim().replace(/\s+/g, '').toLowerCase(),
            quantity: $(cells[2]).text().trim()
          };

          commonRewards.push(reward);
        }
      });

      // Get individual quests
      const quests: Quest[] = [];
      $('h2').each((_, element) => {
        const questName = $(element).text().trim();
        if (questName.includes('Deck')) {
          const deckListingTable = $(element).nextAll('table').first();
          const battleTasksTable = $(element).nextAll('table').eq(1);
          
          const deckListing: DeckCard[] = [];
          let currentListings = [] as any;
          deckListingTable.find('tr').slice(2).each((index, row) => {
            const cells = $(row).find('td');
            cells.each((cellIndex, cell) => {
              if (index % 3 === 1) { // Image row
                const imgSrc = $(cell).find('img').attr('src') || '';
                const match = imgSrc.match(/\/tcgpocket\/th\/([\w-]+)\/(\d+)\.jpg/);
                console.log('Image src:', imgSrc);
                if (match) {
                  currentListings.push({ pack: match[1], cardNumber: parseInt(match[2], 10) });
                }
              } else if (index % 3 === 2) { // Quantity row
                const quantityText = $(cell).text().replace('Quantity', '').trim();
                console.log('Quantity text:', quantityText);
                const quantity = parseInt(quantityText, 10);
                console.log('CELL:', currentListings[cellIndex]);if (!currentListings[cellIndex]) {
                    currentListings[cellIndex] = { quantity: 0 }; // Initialize with default structure
                  }
                  currentListings[cellIndex].quantity = quantity;


                  /*
                  
                    if(index === deckListingTable.length - 1) {
                    deckListing.push(...currentListings);
                    currentListings = [];
                    }

                  */
                  
              } 
              if(index  === deckListingTable.find('tr').slice(2).length - 1 && cellIndex === cells.length - 1) {
                deckListing.push(...currentListings);
                currentListings = [];
              }

              if (index % 3 === 0) { // Empty row
                if (currentListings.length > 0) {
                  deckListing.push(...currentListings);
                  currentListings = [];
                    }
                }
            });

          });

          const battleTasks: BattleTask[] = [];
          battleTasksTable.find('tr').slice(1).each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) {
              const mission = $(cells[0]).text().trim();
              const reward = $(cells[1]).text().trim();
              if (mission && reward && mission !== 'Mission' && reward !== 'Reward') {
                const rewardName = reward.split('*')[0].trim().replace(/\s+/g, '').toLowerCase();
                const rewardQuantity = parseInt(reward.split('*')[1], 10);
                battleTasks.push({ mission, reward: { id: rewardName, quantity: rewardQuantity } });
                
              }
            }
          });

          quests.push({
            name: questName,
            deckListing,
            battleTasks
          });
        }
      });

      return {
        commonRewards,
        quests
      };
    } catch (error) {
      console.error('Error scraping battle data:', error);
      throw new Error('Failed to scrape battle data from Serebii');
    }
  }
}