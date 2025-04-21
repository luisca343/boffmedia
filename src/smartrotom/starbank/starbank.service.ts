import { smartrotomUsers } from '@/_db/schema/SmartRotom';
import { StarBankAccount, starBankAccounts, starBankTransactions, starBankUsersAccounts } from '@/_db/schema/SmartRotomStarBank';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { RowDataPacket } from 'mysql2';
import axios from 'axios';
import { StarBankAccount as StarBankAccountType } from './types';
import { WingullService } from '../wingull/wingull.service';

@Injectable()
export class StarbankService {
    constructor(
        @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
        private readonly wingullService: WingullService
    ) {}

    async getMainAccount(uuid: string) {
        const res = await this.db.select({id: starBankAccounts.id, balance: starBankAccounts.balance}).from(starBankAccounts)
            .innerJoin(starBankUsersAccounts, eq(starBankAccounts.id, starBankUsersAccounts.accountId))
            .innerJoin(smartrotomUsers, eq(starBankUsersAccounts.uuid, uuid))

        return res[0]
    }

    async getBalance(uuid: string) {
        const res = await this.db.select({balance: starBankAccounts.balance}).from(starBankAccounts)
            .innerJoin(starBankUsersAccounts, eq(starBankAccounts.id, starBankUsersAccounts.accountId))
            .innerJoin(smartrotomUsers, eq(starBankUsersAccounts.uuid, uuid))
            
        if(res.length === 0) {
            return {balance: 0}
        }

        return {balance: res[0].balance}
    }

    async getAllAccounts(): Promise<StarBankAccountType[]> {
        return await this.db
            .selectDistinct({id: starBankAccounts.id, balance: starBankAccounts.balance, name: starBankAccounts.name, type: starBankAccounts.type})
            .from(starBankAccounts)
    }

    async getAccounts(uuid: string) {
        const res = await this.db.selectDistinct({id: starBankAccounts.id, balance: starBankAccounts.balance, name: starBankAccounts.name, type: starBankAccounts.type}).from(starBankAccounts)
            .innerJoin(starBankUsersAccounts, eq(starBankAccounts.id, starBankUsersAccounts.accountId))
            .innerJoin(smartrotomUsers, eq(starBankUsersAccounts.uuid, uuid))
        if(res.length === 0)  return []
        return res
    }

    async createAccount(uuid: string, name: string, image?: string) {
        if(name.length === 0) {
            return this.createMainAccount(uuid, name);
        }
        
        const res = await this.db.insert(starBankAccounts).values({name, balance: 0, type: "SECONDARY"} as StarBankAccount).execute() as RowDataPacket[];
        const insert = res[0];
        const res2 = await this.db.insert(starBankUsersAccounts).values({uuid, accountId: insert.insertId}).execute();
        
        return {success: true}
    }
    

    async createMainAccount(uuid: string, username: string) {
       const res = await this.getMainAccount(uuid);
        if(res) {
            return {success: false}
        }
        const res2 = await this.db.insert(starBankAccounts).values({name: username, balance: 0, type: "MAIN"} as StarBankAccount).execute() as RowDataPacket[];
        const insert = res2[0];
        const res3 = await this.db.insert(starBankUsersAccounts).values({uuid, accountId: insert.insertId}).execute();
        return {success: true}
    }

    async getAccountInfo(accountId: number) {
        return await this.db
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
    

    async updateBalance(account: {balance: number, type: string, uuid: string}) {
        try {
            return await this.wingullService.updateBalance(account);
        } catch (error) {
            console.error('Error updating balance:', error);
            throw error;
        }
    }

    async trainerDefeat(amount: number, uuid: string) {
        const account = await this.getMainAccount(uuid);
        const money = await this.wingullService.getCurrentBalance(uuid, amount);
        const prevBalance = account.balance;
        const diff = money - prevBalance;

        if(diff !== 0) return this.transaction(0, account.id, diff, "Derrota de entrenador", "ENTRENADOR");
        return {success: true}
    }

    async shop(body: {uuid: string, npcName: string, itemName: string, operation: string, unitPrice: number, count: number}) {
        const account = await this.getMainAccount(body.uuid);
        const currentBalance = account.balance;
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

        return {success: true}
    }

    async transaction(from:number, to: number, amount: number, reason: string, type: string) {
        const fromAccount = await this.db.select({balance: starBankAccounts.balance}).from(starBankAccounts).where(eq(starBankAccounts.id, from));
        const toAccount = await this.db.select({balance: starBankAccounts.balance}).from(starBankAccounts).where(eq(starBankAccounts.id, to));
        
        if(fromAccount.length === 0 || toAccount.length === 0) {
            return {success: false}
        }

        if(fromAccount[0].balance < amount && from !== 0) {
            return {success: false}
        }


        
        await this.db.update(starBankAccounts).set({balance: fromAccount[0].balance - amount} as StarBankAccount).where(eq(starBankAccounts.id, from)).execute();
        await this.db.update(starBankAccounts).set({balance: toAccount[0].balance + amount} as StarBankAccount).where(eq(starBankAccounts.id, to)).execute();
        
        const fromBalance = from === 0 ? 0 : fromAccount[0].balance - amount;
        const toBalance = to === 0 ? 0 : toAccount[0].balance + amount;

        await this.db.insert(starBankTransactions).values({
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

    async getTransactions(account: number, limit: number = 0) {
        const toJoin = alias(starBankAccounts, "to");
        const fromJoin = alias(starBankAccounts, "from");

        const res = await this.db.selectDistinct(
            {from: starBankTransactions.from, to: starBankTransactions.to, amount: starBankTransactions.amount, 
                reason: starBankTransactions.reason, fromBalance: starBankTransactions.fromBalance, 
                toBalance: starBankTransactions.toBalance, type: starBankTransactions.type, 
                toName: toJoin.name, fromName: fromJoin.name, toType: toJoin.type, fromType: fromJoin.type,
                date: starBankTransactions.date
            }).from(starBankTransactions)
            .innerJoin(toJoin, eq(starBankTransactions.to, toJoin.id))
            .innerJoin(fromJoin, eq(starBankTransactions.from, fromJoin.id))
            .leftJoin(starBankUsersAccounts, or(eq(toJoin.id, starBankUsersAccounts.accountId), eq(fromJoin.id, starBankUsersAccounts.accountId)))
            .where(or(eq(starBankTransactions.from, account), eq(starBankTransactions.to, account)))
            .limit(limit)
            .orderBy(desc(starBankTransactions.date))

        return res
    }

    async getTransactionsByUUID(uuid: string, limit: number = 0) {
        const toJoin = alias(starBankAccounts, "to");
        const fromJoin = alias(starBankAccounts, "from");

        const res = await this.db.selectDistinct(
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
            .limit(limit)
            .orderBy(desc(starBankTransactions.date))

        return res
    }

    async getTransfers(account: number) {
        const toJoin = alias(starBankAccounts, "to");
        const fromJoin = alias(starBankAccounts, "from");
        
        const res = await this.db.selectDistinct(
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
            .where(eq(starBankTransactions.type, "TRANSFERENCIA"))
            .limit(10)
            .orderBy(desc(starBankTransactions.date))

        return res
    }

    async getTransfersByUUID(uuid: string) {
        const toJoin = alias(starBankAccounts, "to");
        const fromJoin = alias(starBankAccounts, "from");
        
        const res = await this.db.select(
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

        return res
    }

    async transferFromMain(uuid: string, to: number, amount: number, concept: string) {
        const mainAccount = await this.getMainAccount(uuid);
        if (!mainAccount) {
            return { success: false, message: "Main account not found" };
        }
        
        return await this.transfer(mainAccount.id, to, amount, concept);
    }
}
