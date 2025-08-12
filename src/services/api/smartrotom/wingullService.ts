import { TeleportPlayerDto, Weather } from '@/generated/api';
import { wingullGET, wingullPOST, ApiResponse, rotomPOST } from '@/services/boffAPI';
import { SuccessResponse } from '@/types';
import { TaxiStop } from '@/types/dto/taxi-stop.dto';


export interface Performance {
    tps: string
    memory: number
    players: number
    uptime: string
}


export type Region = {
    name: string;
    players: number;
    status: string;
};

export type PlayerStats = {
    uuid: string;
    username: string;
    level: number;
    experience: number;
    playtime: number;
    badges: number;
    pokemonCaught: number;
    pokemonSeen: number;
};

export type PokemonW = {
    species: string;
    nickname: string;
    level: number;
    gender: string;
    nature: string;
    ability: string;
    form: string;
    shiny: boolean;
};

export class WingullService {
    // ==================== ECONOMY ENDPOINTS ====================
    
    /**
    * Update player balance in game
    */
    static updateBalance(account: { balance: number; type: string; uuid: string }) {
        return wingullPOST<SuccessResponse>('/updateBalance', account);
    }
    
    /**
    * Get current balance for player from game
    */
    static getCurrentBalance(uuid: string, amount?: number) {
        return wingullPOST<number>('/getCurrentBalance', { uuid, amount });
    }
    
    /**
    * Get player money directly
    */
    static getMoney(uuid: string) {
        return wingullPOST<{ money: number }>('/money', { uuid });
    }
    
    // ==================== PLAYER ENDPOINTS ====================
    
    /**
    * Get player stats
    */
    static getStats(uuid: string) {
        return wingullPOST<PlayerStats>('/stats', { uuid });
    }
    
    /**
    * Get player team
    */
    static getTeam(uuid: string) {
        return wingullPOST<PokemonW[]>('/team', { uuid });
    }
    
    /**
    * Update player Pokédex
    */
    static updateDex(uuid: string) {
        return wingullPOST<SuccessResponse>('/updateDex', { uuid });
    }
    
    /**
    * Get player quests
    */
    static getQuests(uuid: string) {
        return wingullPOST<any>('/quests', { uuid });
    }
    
    /**
    * Send message to player
    */
    static sendMessage(uuid: string, message: string) {
        return wingullPOST<SuccessResponse>('/message', { uuid, message });
    }
    
    /**
    * Give a Pokémon to a player
    */
    static givePokemon(uuid: string, pokespec: string, sendMessage: boolean = true) {
        return wingullPOST<SuccessResponse>('/givePokemon', { uuid, pokespec, sendMessage });
    }
    
    // ==================== WORLD ENDPOINTS ====================
    
    /**
    * Get server performance data
    */
    static getPerformance() {
        return wingullGET<Performance>('/performance');
    }
    
    /**
    * Get regions data
    */
    static getRegions() {
        return wingullGET<Region[]>('/regions');
    }
    
    /**
    * Get current weather information
    */
    static getWeather() {
        return wingullGET<Weather>('/weather');
    }
    
    /**
    * Update NPCs in game world
    */
    static updateNPCs(data: any) {
        return wingullPOST<SuccessResponse>('/updateNPCs', data);
    }
    
    // ==================== TRANSPORTATION ENDPOINTS ====================
    
    /**
    * Get all taxi stops
    */
    static getTaxiStops() {
        return wingullGET<TaxiStop[]>('/taxi/stops');
    }
    
    /**
    * Teleport player to taxi stop
    */
    static teleportPlayer(data: TeleportPlayerDto) {
        return rotomPOST<ApiResponse>("/taxi/teleport", data);
    }
}