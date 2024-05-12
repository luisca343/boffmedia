import { smartrotomUsers } from '@/_db/schema/SmartRotom';
import { starBankAccounts, starBankTransactions, starBankUsersAccounts } from '@/_db/schema/SmartRotomStarBank';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import { desc, eq, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { RowDataPacket } from 'mysql2';

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

    async getAccounts(uuid: string) {
        const res = await this.db.getDrizzle().select({id: starBankAccounts.id, balance: starBankAccounts.balance, name: starBankAccounts.name}).from(starBankAccounts)
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
            .limit(10)
            .orderBy(desc(starBankTransactions.date))

            console.log(res)

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
