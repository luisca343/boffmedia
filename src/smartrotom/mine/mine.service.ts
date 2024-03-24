import {mineGamesDetail, mineGames, mineRewards } from '@/_db/schema/Mine';
import { SmartRotomUser, smartrotomUsers } from '@/_db/schema/SmartRotom';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import { desc, eq, max, sum } from 'drizzle-orm';
import { ResultSetHeader } from 'mysql2';

@Injectable()
export class MinaService {
    constructor(
        private db: MySQL2Service,
    ) {}

    
  async getEnergy(uuid: string) {
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
        const test = await this.db.getDrizzle().update(smartrotomUsers).set({energy: newEnergy, lastCharge: new Date(newTime)}).where(eq(smartrotomUsers.uuid, uuid));
    }

    return {energy: newEnergy, maxEnergy, lastCharge};
  }


  async getEnergyFromBBDD(uuid: string) {
    const res = await this.db.getDrizzle().select({energy: smartrotomUsers.energy}).from(smartrotomUsers).where(eq(smartrotomUsers.uuid, uuid));
    const energy = {
      energy: res[0].energy,
      maxEnergy: 10
    } 
    return energy;
  }

  async getLastCharge(uuid: string) {
    const res = await this.db.getDrizzle().select({ultimaRecarga: smartrotomUsers.lastCharge}).from(smartrotomUsers).where(eq(smartrotomUsers.uuid, uuid));
    return res[0].ultimaRecarga;
    }

    async play(uuid: string) {
        let energy = await this.getEnergy(uuid);
        if(energy.energy < 1) {
            return {error: "No tienes suficiente energía para jugar."};
        }

        let update = {energy: energy.energy - 1};
        if(energy.energy >= energy.maxEnergy) {
            update = {energy: energy.energy - 1, lastCharge: new Date()} as SmartRotomUser
        }

        const insert = await this.db.getDrizzle().insert(mineGames).values({uuid: uuid}) as ResultSetHeader[]
        await this.db.getDrizzle().update(smartrotomUsers).set(update).where(eq(smartrotomUsers.uuid, uuid));

        return {idPartida: insert[0].insertId};
    }

    async getRewards() {
        return await this.db.getDrizzle().select().from(mineRewards);
    }

    async endGame(uuid: string, recompensas: {valor:number, id: number}[] ) {
      const ultimaPartida = await this.db.getDrizzle().select({id: mineGames.id}).from(mineGames).where(eq(mineGames.uuid, uuid)).orderBy(desc(mineGames.id)).limit(1);
      const id = ultimaPartida[0].id;
      const res = await this.db.getDrizzle().select({valor: max(mineRewards.value)}).from(mineRewards);
      const valorMax = res[0].valor;
      
      return this.db.getDrizzle().insert(mineGamesDetail).values(recompensas.map(recompensa => {
          return {gameId: id, rewardId: recompensa.id, value:  valorMax / recompensa.valor, claimed: 0}
      }));
    }

    async getHistory(uuid: string) {
        const history =  (await this.db.getDrizzle().select({id: mineGames.id, itemId: mineRewards.itemId, 
            itemName: mineRewards.name, claimed: mineGamesDetail.claimed, value: mineGamesDetail.value, date: mineGames.createdAt})
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

    async getRanking() {
        return await this.db.getDrizzle()
            .select({username: smartrotomUsers.username, valor: sum(mineGamesDetail.value)})
            .from(mineGames)
            .leftJoin(smartrotomUsers, eq(smartrotomUsers.uuid, mineGames.uuid))
            .leftJoin(mineGamesDetail, eq(mineGamesDetail.gameId, mineGames.id))
            .groupBy(smartrotomUsers.uuid)
            .orderBy(desc(sum(mineGamesDetail.value)));
    }

}
