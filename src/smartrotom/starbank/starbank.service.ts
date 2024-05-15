import { smartrotomUsers } from '@/_db/schema/SmartRotom';
import { starBankAccounts, starBankTransactions, starBankUsersAccounts } from '@/_db/schema/SmartRotomStarBank';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import { desc, eq, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { RowDataPacket } from 'mysql2';
import axios from 'axios';

@Injectable()
export class StarbankService {
    constructor(
        private db: MySQL2Service,
    ) {}

    async getMainAccount(uuid: string) {
        const res = await this.db.getDrizzle().select({id: starBankAccounts.id, balance: starBankAccounts.balance}).from(starBankAccounts)
            .innerJoin(starBankUsersAccounts, eq(starBankAccounts.id, starBankUsersAccounts.accountId))
            .innerJoin(smartrotomUsers, eq(starBankUsersAccounts.uuid, uuid))

        return res[0]
    }

    async getBalance(uuid: string) {
        const res = await this.db.getDrizzle().select({balance: starBankAccounts.balance}).from(starBankAccounts)
            .innerJoin(starBankUsersAccounts, eq(starBankAccounts.id, starBankUsersAccounts.accountId))
            .innerJoin(smartrotomUsers, eq(starBankUsersAccounts.uuid, uuid))
            
        if(res.length === 0) {
            return {balance: 0}
        }

        return {balance: res[0].balance}
    }

    async getAllAccounts() {
        return await this.db.getDrizzle()
            .selectDistinct({id: starBankAccounts.id, balance: starBankAccounts.balance, name: starBankAccounts.name, type: starBankAccounts.type})
            .from(starBankAccounts)
    }

    async getAccounts(uuid: string) {
        const res = await this.db.getDrizzle().selectDistinct({id: starBankAccounts.id, balance: starBankAccounts.balance, name: starBankAccounts.name, type: starBankAccounts.type}).from(starBankAccounts)
            .innerJoin(starBankUsersAccounts, eq(starBankAccounts.id, starBankUsersAccounts.accountId))
            .innerJoin(smartrotomUsers, eq(starBankUsersAccounts.uuid, uuid))
        if(res.length === 0)  return []
        return res
    }

    async createAccount(uuid: string, name: string) {
        if(name.length === 0) {
            this.createMainAccount(uuid, name);
        }
        return {success: true}
    }

    async createMainAccount(uuid: string, username: string) {
       const res = await this.getMainAccount(uuid);
       console.log(res)
        if(res) {
            return {success: false}
        }
        const res2 = await this.db.getDrizzle().insert(starBankAccounts).values({name: username, balance: 0, type: "MAIN"}).execute() as RowDataPacket[];
        const insert = res2[0];
        const res3 = await this.db.getDrizzle().insert(starBankUsersAccounts).values({uuid, accountId: insert.insertId}).execute();
        return {success: true}
    }

    async getAccountInfo(accountId: number) {
        return await this.db.getDrizzle()
            .select({balance: starBankAccounts.balance, type: starBankAccounts.type, uuid: starBankUsersAccounts.uuid})
            .from(starBankAccounts)
            .leftJoin(starBankUsersAccounts, eq(starBankAccounts.id, starBankUsersAccounts.accountId))
            .where(eq(starBankAccounts.id, accountId));
    }
    
    async transfer(from: number, to: number, amount: number, concept: string) {
        const trans = await this.transaction(from, to, amount, concept, "TRANSFERENCIA");
    
        const fromAccount = await this.getAccountInfo(from);
        const toAccount = await this.getAccountInfo(to);
    
        const accounts = [fromAccount[0], toAccount[0]];
    
        accounts.forEach(async (account) => {
            if(account.type === "MAIN") {
                await this.updateBalance(account);
            }
        });
        
        return trans;
    }
    

    updateBalance(account: {balance: number, type: string, uuid: string}) {
        axios.post(`${process.env.WINGULL_API}/updateBalance`, account)
            .catch(error => {
                console.log(error);
        });
      
    }

    async trainerDefeat(amount: number, uuid: string) {
        const account = await this.getMainAccount(uuid);

        console.log(`Petición a wingull: ${process.env.WINGULL_API}/getCurrentBalance`)
        const test = await axios.post(`${process.env.WINGULL_API}/getCurrentBalance`, {uuid, amount})
        const money = test.data as number
    
        const prevBalance = account.balance;
        
        const diff = money - prevBalance;

        console.log(`Dinero actual: ${money}, Dinero anterior: ${prevBalance}, Diferencia: ${diff}`)

        if(diff !== 0) return this.transaction(0, account.id, diff, "Derrota de entrenador", "ENTRENADOR");
        return {success: true}

    }

    async shop(body: {uuid: string, npcName: string, itemName: string, operation: string, unitPrice: number, count: number}) {
        console.log(body)
        const account = await this.getMainAccount(body.uuid);
        const currentBalance = account.balance;
        console.log(account)
        const total = body.unitPrice * body.count;
        if(body.operation === "COMPRA") {
            if(currentBalance < total) {
                return {success: false}
            }
            console.log(`Compra de ${body.count} ${body.itemName} a ${body.npcName} por ${total}`)
            await this.transaction(account.id,  0,  total,  `Compra de ${body.count} ${body.itemName} a ${body.npcName}`, "COMPRA");
        } else {
            console.log(`Venta de ${body.count} ${body.itemName} a ${body.npcName} por ${total}`)
            await this.transaction( 0, account.id, total,  `Venta de ${body.count} ${body.itemName} a ${body.npcName}`, "VENTA");
        }
    }

    async transaction(from:number, to: number, amount: number, reason: string, type: string) {
        const fromAccount = await this.db.getDrizzle().select({balance: starBankAccounts.balance}).from(starBankAccounts).where(eq(starBankAccounts.id, from));
        const toAccount = await this.db.getDrizzle().select({balance: starBankAccounts.balance}).from(starBankAccounts).where(eq(starBankAccounts.id, to));
        
        if(fromAccount.length === 0 || toAccount.length === 0) {
            return {success: false}
        }

        if(fromAccount[0].balance < amount && from !== 0) {
            return {success: false}
        }


        await this.db.getDrizzle().update(starBankAccounts).set({balance: fromAccount[0].balance - amount}).where(eq(starBankAccounts.id, from)).execute();
        await this.db.getDrizzle().update(starBankAccounts).set({balance: toAccount[0].balance + amount}).where(eq(starBankAccounts.id, to)).execute();
        
        const fromBalance = from === 0 ? 0 : fromAccount[0].balance - amount;
        const toBalance = to === 0 ? 0 : toAccount[0].balance + amount;

        console.log(fromBalance, toBalance)

        await this.db.getDrizzle().insert(starBankTransactions).values({
            from,
            to,
            amount,
            fromBalance,
            toBalance,
            reason,
            type,
            date: new Date().toISOString(),
        }).execute();
        return {success: true}
    }

    async getTransactions(uuid: string) {
        const toJoin = alias(starBankAccounts, "to");
        const fromJoin = alias(starBankAccounts, "from");

        const res = await this.db.getDrizzle().selectDistinct(
            {from: starBankTransactions.from, to: starBankTransactions.to, amount: starBankTransactions.amount, 
                reason: starBankTransactions.reason, fromBalance: starBankTransactions.fromBalance, 
                toBalance: starBankTransactions.toBalance, type: starBankTransactions.type, 
                toName: toJoin.name, fromName: fromJoin.name, toType: toJoin.type, fromType: fromJoin.type,
                date: starBankTransactions.date
            }).from(starBankTransactions)
            .innerJoin(toJoin, eq(starBankTransactions.to, toJoin.id))
            .innerJoin(fromJoin, eq(starBankTransactions.from, fromJoin.id))
            .leftJoin(starBankUsersAccounts, or(eq(toJoin.id, starBankUsersAccounts.accountId), eq(fromJoin.id, starBankUsersAccounts.accountId)))
            .leftJoin(smartrotomUsers, eq(starBankUsersAccounts.uuid, uuid))
            .limit(20)
            .orderBy(desc(starBankTransactions.date))

        return res
    }

    async getTransfers(uuid: string) {
        const toJoin = alias(starBankAccounts, "to");
        const fromJoin = alias(starBankAccounts, "from");
        
        const res = await this.db.getDrizzle().select(
            {from: starBankTransactions.from, to: starBankTransactions.to, amount: starBankTransactions.amount, 
                reason: starBankTransactions.reason, fromBalance: starBankTransactions.fromBalance, 
                toBalance: starBankTransactions.toBalance, type: starBankTransactions.type, 
                toName: toJoin.name, fromName: fromJoin.name, toType: toJoin.type, fromType: fromJoin.type,
                date: starBankTransactions.date
            }
            
            ).from(starBankTransactions)
            .innerJoin(toJoin, eq(starBankTransactions.to, toJoin.id))
            .innerJoin(fromJoin, eq(starBankTransactions.from, fromJoin.id))
            .innerJoin(starBankUsersAccounts, or(eq(toJoin.id, starBankUsersAccounts.accountId), eq(fromJoin.id, starBankUsersAccounts.accountId)))
            .innerJoin(smartrotomUsers, eq(starBankUsersAccounts.uuid, uuid))
            .where(eq(starBankTransactions.type, "TRANSFERENCIA"))
            .limit(10)
            .orderBy(desc(starBankTransactions.date))

            console.log(res)

        return res
    }
}
