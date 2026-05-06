import { WingullSQL2Service } from '@/_utils/WingullSQL2Service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WingullRepository {
  constructor(private readonly wingullSQL2Service: WingullSQL2Service) {}


  async getWorldGuardWorlds(): Promise<{ id: number; name: string }[]> {
    try {
      const query = 'SELECT * FROM worldguard_world';
      const [rows] = await this.wingullSQL2Service.query(query);
      return rows as { id: number; name: string }[];
    } catch (error: any) {
      console.error('Error fetching WorldGuard worlds:', error);
      throw new Error('Failed to fetch WorldGuard worlds');
    }
  }

    async getPlayersOwnedRegions(uuid: string): Promise<{ region_id: string; town: string; type: string; number: number; world_id: number; owner: boolean; name: string; uuid: string }[]> {
    console.log(`Fetching owned regions for UUID: ${uuid}`);
    try {
        const query = `
        SELECT r.region_id, r.world_id, r.owner, u.name, u.uuid
        FROM worldguard_region_players r
        JOIN worldguard_user u ON r.user_id = u.id
        WHERE u.uuid = ? AND r.owner = true
        `;
        const [rows] = await this.wingullSQL2Service.query(query, [uuid]);
        console.log('Raw query result:', rows);

        return (rows as { region_id: string; world_id: number; owner: boolean; name: string; uuid: string }[]).map(row => {
        const regionParts = row.region_id.split('__');
        const town = regionParts[0]; // e.g., "pueblo_mizu"
        const typeAndNumber = regionParts[1]?.split('_'); // e.g., ["parcela", "1"]
        const type = typeAndNumber?.[0] || '';
        const number = parseInt(typeAndNumber?.[1] || '0', 10);

        return {
            region_id: row.region_id, // Include the original region_id
            town,
            type,
            number,
            world_id: row.world_id,
            owner: row.owner,
            name: row.name,
            uuid: row.uuid,
        };
        });
    } catch (error: any) {
        console.error('Error fetching players owned regions:', error);
        throw new Error('Failed to fetch players owned regions');
    }
    }

async getAllPlots(): Promise<{ town: string; type: string; number: number; ownerUuid?: string }[]> {
    try {
      const query = `
        SELECT r.id, u.uuid AS ownerUuid
        FROM worldguard_region r
        LEFT JOIN worldguard_region_players rp ON r.id = rp.region_id
        LEFT JOIN worldguard_user u ON rp.user_id = u.id AND rp.owner = true
      `;
      const [rows] = await this.wingullSQL2Service.query(query);

      return (rows as { id: string; ownerUuid?: string }[])
        .map(row => {
          const regionParts = row.id.split('__');
          const town = regionParts[0]; // e.g., "pueblo_mizu"
          const typeAndNumber = regionParts[1]?.split('_'); // e.g., ["parcela", "1"]
          const type = typeAndNumber?.[0] || '';
          const number = parseInt(typeAndNumber?.[1] || '0', 10);

          if (town && type) {
            return { 
              town, 
              type, 
              number: isNaN(number) ? undefined : number, 
              ownerUuid: row.ownerUuid || undefined 
            };
          }
          return null; // Explicitly return null for invalid entries
        })
        .filter(Boolean); // Remove null values
    } catch (error: any) {
      console.error('Error fetching all plots:', error);
      throw new Error('Failed to fetch all plots');
    }
  }
}