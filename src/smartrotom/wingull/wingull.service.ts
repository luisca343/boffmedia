import { DRIZZLE } from '@/drizzle/drizzle.module';
import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import axios from 'axios';
import { TaxiStop } from '../_dto/taxi-stop.dto';

@Injectable()
export class WingullService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  //=====================================================
  // Economy endpoints
  //=====================================================
  
  /**
   * Updates the player's currency balance in the game
   * @param account The account data containing balance, type and uuid
   * @returns Response indicating success or failure
   */
  async updateBalance(account: {balance: number, type: string, uuid: string}): Promise<any> {
    try {
      console.log('Updating balance for player:', account.uuid, 'New balance:', account.balance);
      const response = await axios.post(`${process.env.WINGULL_API}/updateBalance`, account);
      return response.data;
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  }

  /**
   * Gets the current balance for a player from the game server
   * @param uuid The player's UUID
   * @param amount Optional amount parameter that may be needed by the API
   * @returns The current balance as a number
   */
  async getCurrentBalance(uuid: string, amount?: number): Promise<number> {
    try {
      console.log('Getting current balance for player:', uuid);
      const response = await axios.post(`${process.env.WINGULL_API}/getCurrentBalance`, {
        uuid,
        amount
      });
      return response.data as number;
    } catch (error) {
      console.error('Error getting current balance:', error);
      throw error;
    }
  }
  
  /**
   * Gets player's money directly (dinero endpoint)
   * @param uuid The player's UUID
   * @returns The player's money amount
   */
  async getMoney(uuid: string): Promise<number> {
    try {
      const response = await axios.post(`${process.env.WINGULL_API}/dinero`, { uuid });
      return response.data as number;
    } catch (error) {
      console.error('Error getting player money:', error);
      throw error;
    }
  }

  //=====================================================
  // Player endpoints
  //=====================================================
  
  /**
   * Gets player stats from the game
   * @param uuid The player's UUID
   * @returns Player stats object
   */
  async getStats(uuid: string) {
    try {
      const response = await axios.post(`${process.env.WINGULL_API}/stats`, { uuid });
      return response.data;
    } catch (error) {
      console.error('Error getting player stats:', error);
      throw error;
    }
  }
  
  /**
   * Gets player's Pokémon team
   * @param uuid The player's UUID
   * @returns Player's team data
   */
  async getTeam(uuid: string) {
    try {
      const response = await axios.post(`${process.env.WINGULL_API}/equipo`, { uuid });
      return response.data;
    } catch (error) {
      console.error('Error getting player team:', error);
      throw error;
    }
  }
  
  /**
   * Updates the player's Pokédex
   * @param uuid The player's UUID
   * @returns The updated Pokédex data
   */
  async updateDex(uuid: string): Promise<{ SEEN: number[], CAUGHT: number[] }> {
    try {
      console.log('Updating Pokédex for player:', uuid);
      const response = await axios.post(`${process.env.WINGULL_API}/updatedex`, { uuid });
      return response.data as { SEEN: number[], CAUGHT: number[] };
    } catch (error) {
      console.error('Error updating Pokédex:', error);
      throw error;
    }
  }
  
  /**
   * Gets player quests information
   * @param uuid The player's UUID
   * @returns Player's quest data
   */
  async getQuests(uuid: string) {
    try {
      const response = await axios.post(`${process.env.WINGULL_API}/quests`, { uuid });
      return response.data;
    } catch (error) {
      console.error('Error getting player quests:', error);
      throw error;
    }
  }
  
  /**
   * Sends a message to a player
   * @param uuid The player's UUID
   * @param message The message to send
   * @returns Success status
   */
  async sendMessage(uuid: string, message: string) {
    try {
      const response = await axios.post(`${process.env.WINGULL_API}/mensaje`, { 
        uuid, 
        mensaje: message 
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message to player:', error);
      throw error;
    }
  }

  /**
   * Gives items to a player in packaged chests
   * @param uuid The player's UUID
   * @param items Array of items with id, amount, and optional display_name and lore
   * @returns Response indicating success or failure
   */
  async giveItems(uuid: string, items: Array<{
    id: string,
    amount: number,
    display_name?: string,
    lore?: string[]
  }>): Promise<any> {
    try {
      console.log('Giving items to player:', uuid, 'Items count:', items.length);
      const response = await axios.post(`${process.env.WINGULL_API}/giveitems`, {
        uuid,
        items
      });
      return response.data;
    } catch (error) {
      console.error('Error giving items to player:', error);
      throw error;
    }
  }

    /**
   * Gives a Pokémon to a player using specific parameters
   * @param uuid The player's UUID
   * @param pokespec The Pokémon specification string
   * @param sendMessage Whether to send a message to the player
   * @returns Response indicating success or failure
   */
    async givePokemon(
        uuid: string, 
        pokespec: string, 
        sendMessage: boolean = true
      ): Promise<any> {
        try {
          console.log('Giving Pokémon to player:', uuid, 'Spec:', pokespec);
          const response = await axios.post(`${process.env.WINGULL_API}/givepokemon`, {
            uuid,
            pokespec,
            sendMessage
          });
          return response.data;
        } catch (error) {
          console.error('Error giving Pokémon to player:', error);
          throw error;
        }
      }

  //=====================================================
  // World endpoints
  //=====================================================
  
  /**
   * Gets server performance data
   * @returns Performance metrics
   */
  async getPerformance() {
    try {
      const response = await axios.get(`${process.env.WINGULL_API}/performance`);
      return response.data;
    } catch (error) {
      console.error('Error getting server performance:', error);
      throw error;
    }
  }
  
  /**
   * Gets regions data with optional color formatting
   * @param townColors Optional color mapping for towns/regions
   * @returns List of regions with color information if provided
   */
  async getRegions(townColors?: any) {
    try {
      const regions = await axios.get(`${process.env.WINGULL_API}/regions`);
      
      if (townColors) {
        return regions.data.map((region: any) => {
          const color = townColors[region.name.toUpperCase()];
          if (color) {
            region.fillColor = color.fill & 0xffffffff;
            region.strokeColor = color.border & 0xffffffff;
          }
          return region;
        });
      }
      
      return regions.data;
    } catch (error) {
      console.error('Error getting regions:', error);
      throw error;
    }
  }
  
  /**
   * Gets current weather information
   * @returns Weather data
   */
  async getWeather() {
    try {
      const response = await axios.get(`${process.env.WINGULL_API}/weather`);
      return response.data;
    } catch (error) {
      console.error('Error getting weather:', error);
      throw error;
    }
  }
  
  /**
   * Updates NPCs in the game world
   * @param data NPC update data
   * @returns Update status
   */
  async updateNPCs(data: any) {
    try {
      const response = await axios.post(`${process.env.WINGULL_API}/updateNPCs`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating NPCs:', error);
      throw error;
    }
  }

  //=====================================================
  // Transportation endpoints
  //=====================================================
  
  /**
   * Gets all available taxi stops
   * @returns Record of taxi stops
   */
  async getTaxiStops(): Promise<Record<string, TaxiStop>> {
    try {
      const response = await axios.get(`${process.env.WINGULL_API}/taxi/stops`);
      console.log('Taxi stops retrieved');
      return response.data as Record<string, TaxiStop>;
    } catch (error) {
      console.error('Error fetching taxi stops:', error);
      throw error;
    }
  }

  /**
   * Teleports a player to a taxi stop
   * @param id The taxi stop ID
   * @param uuid The player's UUID
   * @returns Success status
   */
  async teleportPlayer(id: string, uuid: string): Promise<boolean> {
    try {
      console.log('Teleporting player:', uuid, 'to stop:', id);
      const response = await axios.post(`${process.env.WINGULL_API}/taxi/teleport`, {
        id,
        uuid
      });
      return response.data as boolean;
    } catch (error) {
      console.error('Error teleporting player:', error);
      throw error;
    }
  }
}