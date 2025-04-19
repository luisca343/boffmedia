import {mineGamesDetail, mineGames, mineRewards, DetallePartidaMina } from '@/_db/schema/SmartRotomMine';
import { smartRotomInventory, SmartRotomInventoryItem, SmartRotomUser, smartrotomUsers } from '@/_db/schema/SmartRotom';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, max, sql, sum } from 'drizzle-orm';
import { ResultSetHeader } from 'mysql2';

export enum ItemRarity {
    COMMON = "common",
    UNCOMMON = "uncommon",
    RARE = "rare",
    EPIC = "epic",
    LEGENDARY = "legendary"
}

@Injectable()
export class MinaService {
    constructor(
        @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
    ) {}

  async getEnergy(uuid: string): Promise<{energy: number, maxEnergy: number, lastCharge: Date}> {
    const hoursToCharge = 1;
    const maxEnergy = 10;
    let energy = await this.getEnergyFromBBDD(uuid);
    let lastCharge = await this.getLastCharge(uuid);
    
    if(energy.energy >= maxEnergy) {
        return {energy: energy.energy, maxEnergy, lastCharge};
    }

    let now = new Date();
    let diff = now.getTime() - lastCharge.getTime();
    let diffHours = diff / (1000 * 60 * 60);
    const extraEnergy = Math.floor(diffHours / hoursToCharge);
    let newEnergy = energy.energy + extraEnergy;

    if(newEnergy > maxEnergy) {
        newEnergy = maxEnergy;
    }

    if(newEnergy > energy.energy) {
        const newTime = lastCharge.getTime() +  hoursToCharge * 60 * 60 * 1000;
        const test = await this.db.update(smartrotomUsers).set({energy: newEnergy, lastCharge: new Date(newTime)} as SmartRotomUser).where(eq(smartrotomUsers.uuid, uuid));
    }

    return {energy: newEnergy, maxEnergy, lastCharge};
  }


  async getEnergyFromBBDD(uuid: string) {
    const res = await this.db.select({energy: smartrotomUsers.energy}).from(smartrotomUsers).where(eq(smartrotomUsers.uuid, uuid));
    const energy = {
      energy: res[0].energy,
      maxEnergy: 10
    } 
    return energy;
  }

  async getLastCharge(uuid: string) {
    const res = await this.db.select({ultimaRecarga: smartrotomUsers.lastCharge}).from(smartrotomUsers).where(eq(smartrotomUsers.uuid, uuid));
    return res[0].ultimaRecarga;
    }

    async play(uuid: string) {
        let energy = await this.getEnergy(uuid);
        if(energy.energy < 1) {
            return {error: "No tienes suficiente energía para jugar."};
        }

        let update = {energy: energy.energy - 1} as SmartRotomUser;
        if(energy.energy >= energy.maxEnergy) {
            update = {energy: energy.energy - 1, lastCharge: new Date()} as SmartRotomUser
        }

        const insert = await this.db.insert(mineGames).values({uuid: uuid}) as ResultSetHeader[]
        await this.db.update(smartrotomUsers).set(update).where(eq(smartrotomUsers.uuid, uuid));

        return {idPartida: insert[0].insertId};
    }

    async getRewards(): Promise<RewardEntry[]> {
        return await this.db.select().from(mineRewards);
    }

    async getRewardsByType(): Promise<{ drops: { [key: string]: { items: RewardEntry[], totalValue: number } }, totalValue: number }> {
        const rewards = await this.db.select().from(mineRewards);
        let arr = rewards.reduce((acc, curr) => {
            if (!acc[curr.type]) {
                acc[curr.type] = { items: [], totalValue: 0 };
            }
            acc[curr.type].items.push(curr);
            acc[curr.type].totalValue += curr.value;
            return acc;
        }, {} as { [key: string]: { items: any[], totalValue: number } });
    
        let arrEntries = Object.entries(arr);
    
        arrEntries.sort((a, b) => b[1].totalValue - a[1].totalValue);
    
        arr = Object.fromEntries(arrEntries);
    
        const totalValue = Object.values(arr).reduce((sum, type) => sum + type.totalValue, 0);
    
        return { drops: arr, totalValue };
    }

    async endGame(uuid: string, rewards: {value:number, id: number}[] ): Promise<{idPartida: number}> {
        const ultimaPartida = await this.db.select({id: mineGames.id}).from(mineGames).where(eq(mineGames.uuid, uuid)).orderBy(desc(mineGames.id)).limit(1);
        const id = ultimaPartida[0].id;
        
        const res = await this.db.select({valor: max(mineRewards.value)}).from(mineRewards);
        const valorMax = res[0].valor;
        
        await this.db.insert(mineGamesDetail).values(rewards.map(reward => {
            return {gameId: id, rewardId: reward.id, value: valorMax / reward.value, claimed: 0}
        }));
        
        // Get reward details for inventory insertion
        if (rewards.length > 0) {
            const rewardIds = rewards.map(r => r.id);
            const rewardDetails = await this.db.select({
                id: mineRewards.id,
                name: mineRewards.name,
                type: mineRewards.type,
                itemId: mineRewards.itemId,
                value: mineRewards.value // Include value for rarity calculation
            })
            .from(mineRewards)
            .where(inArray(mineRewards.id, rewardIds));
            
            // Create inventory entries
            const inventoryEntries = rewardDetails.map(reward => {
                const rarity = this.calculateRarityFromWeight(reward.value);
                
                return {
                    uuid: uuid,
                    itemId: reward.itemId,
                    itemType: reward.type,
                    name: reward.name,
                    amount: 1,
                    sourceType: 'mine',
                    sourceId: id,
                    used: 0,
                    rarity: rarity // Add the rarity field
                };
            });
            
            if (inventoryEntries.length > 0) {
                await this.db.insert(smartRotomInventory).values(inventoryEntries);
            }
        }
        
        return {idPartida: id};
    }

    async getHistory(uuid: string): Promise<{[key: number]: HistoryEntry[]}> {
        const history =  (await this.db.select({id: mineGames.id, itemId: mineRewards.itemId, 
            itemName: mineRewards.name, value: mineGamesDetail.value, date: mineGames.createdAt})
        .from(mineGames)
        .leftJoin(mineGamesDetail, eq(mineGames.id, mineGamesDetail.gameId))
        .leftJoin(mineRewards, eq(mineRewards.id, mineGamesDetail.rewardId))
        .where(eq(mineGames.uuid, uuid)))

        let arr =  history.reduce((acc, curr) => {
            if(!acc[curr.id]) {
                acc[curr.id] = [];
            }
            if(curr.itemId) {
                acc[curr.id].push(curr);
            } else {
                console.log("NADA");
                console.log(curr.id)
                acc[curr.id].push({itemId: "nada:nada", itemName: "Nada", claimed: 0, value: 0, date: curr.date});
            }
            return acc;
        }, {} as {[key: number]: any[]});

        return arr
    }

    async getRanking(): Promise<RankingEntry[]> {
        return await this.db
          .select({
            username: smartrotomUsers.username,
            value: sql<number>`SUM(${mineGamesDetail.value})`.as('value')
          })
          .from(mineGames)
          .leftJoin(smartrotomUsers, eq(smartrotomUsers.uuid, mineGames.uuid))
          .leftJoin(mineGamesDetail, eq(mineGamesDetail.gameId, mineGames.id))
          .groupBy(smartrotomUsers.uuid)
          .orderBy(desc(sum(mineGamesDetail.value))) as RankingEntry[];
      }

      async getUnclaimed(uuid: string) {
        const res = await this.db.select({
            itemId: smartRotomInventory.itemId,
            type: smartRotomInventory.itemType,
            id: smartRotomInventory.id
        })
        .from(smartRotomInventory)
        .where(and(
            eq(smartRotomInventory.uuid, uuid),
            eq(smartRotomInventory.used, 0),
            eq(smartRotomInventory.sourceType, 'mine')
        ));
    
        // Group by item
        let groupedItems = res.reduce((acc, curr) => {
            if (!acc[curr.itemId]) {
                acc[curr.itemId] = { 
                    itemId: curr.itemId,
                    type: curr.type, 
                    amount: 0, 
                };
            }
            acc[curr.itemId].amount += 1;
            return acc;
        }, {} as { [key: string]: { itemId: string, type: string, amount: number } });
    
        // Convert to array
        let items = Object.values(groupedItems);
        
        return items;
    }

    async claim(uuid: string): Promise<number[]> {
        const res = await this.db.select({ id: smartRotomInventory.id })
            .from(smartRotomInventory)
            .where(and(
                eq(smartRotomInventory.uuid, uuid),
                eq(smartRotomInventory.used, 0),
                eq(smartRotomInventory.sourceType, 'mine')
            ));
    
        const ids = res.map((row) => row.id);
    
        if (ids.length > 0) {
            await this.db.update(smartRotomInventory)
                .set({ used: 1 } as SmartRotomInventoryItem)
                .where(inArray(smartRotomInventory.id, ids));
                
            // Keep backward compatibility by also updating the mineGamesDetail table
            /*
            await this.db.update(mineGamesDetail)
                .set({ claimed: 1 } as any)
                .where(
                    inArray(mineGamesDetail.gameId,
                        this.db.select({ sourceId: smartRotomInventory.sourceId })
                            .from(smartRotomInventory)
                            .where(inArray(smartRotomInventory.id, ids))
                    )
                );*/
        }
    
        return ids;
    }

    private calculateRarityFromWeight(weight: number): string {
        if (weight <= 10) return ItemRarity.LEGENDARY;
        if (weight <= 200) return ItemRarity.EPIC;
        if (weight <= 1500) return ItemRarity.RARE;
        if (weight <= 5000) return ItemRarity.UNCOMMON;
        
        return ItemRarity.COMMON;
    }
}
