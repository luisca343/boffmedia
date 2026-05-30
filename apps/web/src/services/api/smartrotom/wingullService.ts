import { PlayerStats, PokemonW, Region, SuccessResponse, TaxiStop, TeleportPlayerDto, Weather, Performance } from '@boffmedia/shared';
import { wingullGET, wingullPOST, wingullPATCH, ApiResponse, rotomPOST } from '@/services/boffAPI';
import { 
    BattleTeamData, 
    BattleTeam, 
    CreateBattleTeamRequest, 
    UpdateBattleTeamRequest
} from '@/types/dto/battle-team.dto';

// TODO: replace with import from '@boffmedia/shared' after running `pnpm generate:shared`
export interface PlotOwner {
    uuid: string;
    username: string;
}

export interface PlotEntry {
    town: string;
    type: string;
    number?: number;
    owner: PlotOwner | null;
    centerX?: number;
    centerZ?: number;
}



export type ServerRegion = Region;
export type PixelmonPlayerStats = PlayerStats;

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
     * Get player PC
     */
    static getPC(uuid: string) {
        return wingullPOST<any[]>('/pc', { uuid });
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
    
    /**
     * Fetch all WorldGuard worlds
     */
    static getWorldGuardWorlds() {
        return wingullGET<any>('/worldguard-worlds');
    }
    
    /**
     * Fetch player's owned regions by UUID
     */
    static getPlayersOwnedRegions(uuid: string) {
        return wingullGET<any>(`/owned-regions/${uuid}`);
    }
    
    /**
     * Fetch all regions (all region types)
     */
    static getAllRegions() {
        return wingullGET<PlotEntry[]>('/plots');
    }

    /**
     * Fetch all plots (residential plots only)
     */
    static getPlots() {
        return wingullGET<PlotEntry[]>('/parcelas');
    }
    
    /**
     * Get all available towns
     */
    static getAllTowns() {
        return wingullGET<string[]>('/towns');
    }
    
    /**
     * Get information about a specific town
     */
    static getTownInfo(townName: string) {
        return wingullGET<any>(`/towns/${townName}`);
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

    // ==================== BATTLE TEAMS ENDPOINTS ====================
    
    /**
    * Get player's battle teams
    */
    static async getBattleTeams(uuid: string) {
        const response = await wingullPOST<BattleTeamData>('/battleteams', { uuid });
        return response;
    }
    
    /**
    * Create a new battle team
    */
    static createBattleTeam(uuid: string, teamData: CreateBattleTeamRequest) {
        return wingullPOST<BattleTeam>('/battleteams/create', { uuid, ...teamData });
    }
    
    /**
    * Update battle team details
    */
    static updateBattleTeam(uuid: string, teamData: UpdateBattleTeamRequest) {
        return wingullPOST<BattleTeam>('/battleteams/update', { uuid, ...teamData });
    }
    
    /**
    * Delete a battle team
    */
    static deleteBattleTeam(uuid: string, teamId: string) {
        return wingullPOST<SuccessResponse>('/battleteams/delete', { uuid, teamId });
    }
    
    /**
    * Set active battle team
    */
    static setActiveBattleTeam(uuid: string, teamId: string) {
        return wingullPOST<SuccessResponse>('/battleteams/setactive', { uuid, teamId });
    }

    // ==================== PC MANAGEMENT ENDPOINTS ====================
    
    /**
    * Move Pokemon between PC boxes and party
    * Use box = -1 for party moves
    */
    static movePokemonInPC(uuid: string, data: {
        sourceBox: number;
        sourceIndex: number;
        destinationBox: number;
        destinationIndex: number;
    }) {
        console.log('Moving Pokemon with data:', { uuid, ...data });
        return wingullPOST<SuccessResponse>('/pc/move', { uuid, ...data });
    }

    // ==================== POLICIA ENDPOINTS ====================

    static getPoliciaDenuncias(filters?: { playerUuid?: string; status?: string }) {
        const params = new URLSearchParams();
        if (filters?.playerUuid) params.set('playerUuid', filters.playerUuid);
        if (filters?.status) params.set('status', filters.status);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return wingullGET<any[]>(`/policia/denuncias${qs}`);
    }

    static createPoliciaDenuncia(dto: {
        reporterUuid: string;
        reporterUsername: string;
        accusedUuid?: string;
        accusedUsername?: string;
        town: string;
        plotNumber: number;
        category: string;
        description: string;
    }) {
        return wingullPOST<any>('/policia/denuncias', dto);
    }

    static updatePoliciaDenunciaStatus(id: number, dto: { status: string; notes?: string; resolvedBy?: string }) {
        return wingullPATCH<any>(`/policia/denuncias/${id}/status`, dto);
    }

    static getPoliciaBuscados(filters?: { severity?: string; status?: string }) {
        const params = new URLSearchParams();
        if (filters?.severity) params.set('severity', filters.severity);
        if (filters?.status) params.set('status', filters.status);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return wingullGET<any[]>(`/policia/buscados${qs}`);
    }

    static createPoliciaBuscado(dto: {
        playerUuid: string;
        playerUsername: string;
        offense: string;
        severity: string;
        reportedBy: string;
        notes?: string;
    }) {
        return wingullPOST<any>('/policia/buscados', dto);
    }

    static updatePoliciaBuscadoStatus(id: number, dto: { status: string }) {
        return wingullPATCH<any>(`/policia/buscados/${id}/status`, dto);
    }

    static getPoliciaMultas(filters?: { playerUuid?: string; status?: string }) {
        const params = new URLSearchParams();
        if (filters?.playerUuid) params.set('playerUuid', filters.playerUuid);
        if (filters?.status) params.set('status', filters.status);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return wingullGET<any[]>(`/policia/multas${qs}`);
    }

    static createPoliciaMulta(dto: {
        playerUuid: string;
        playerUsername: string;
        amount: number;
        reason: string;
        issuedBy: string;
    }) {
        return wingullPOST<any>('/policia/multas', dto);
    }

    static updatePoliciaMultaStatus(id: number, dto: { status: string }) {
        return wingullPATCH<any>(`/policia/multas/${id}/status`, dto);
    }

    static getPoliciaOficiales() {
        return wingullGET<any[]>('/policia/oficiales');
    }

    static getPoliciaPlotHistorial(town: string, plotNumber: number) {
        return wingullGET<any[]>(`/policia/historial/${town}/${plotNumber}`);
    }

    static getPoliciaZonasRestringidas() {
        return wingullGET<any[]>('/policia/zonas-restringidas');
    }
}