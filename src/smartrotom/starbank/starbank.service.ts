import { smartrotomUsers } from '@/_db/schema/SmartRotom';
import { starBankAccounts, starBankUsersAccounts } from '@/_db/schema/StarBank';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { RowDataPacket } from 'mysql2';

@Injectable()
export class StarbankService {
    constructor(
        private db: MySQL2Service,
    ) {}

    async getBalance(uuid: string) {
        const res = await this.db.getDrizzle().select({balance: starBankAccounts.balance}).from(starBankAccounts)
            .leftJoin(starBankUsersAccounts, eq(starBankAccounts.id, starBankUsersAccounts.accountId))
            .leftJoin(smartrotomUsers, eq(starBankUsersAccounts.uuid, uuid))
            
        if(res.length === 0) {
            return {balance: 0}
        }

        return {balance: res[0].balance}
    }

    async getAccounts(uuid: string) {
        const res = await this.db.getDrizzle().select({balance: starBankAccounts.balance, name: starBankAccounts.name}).from(starBankAccounts)
            .leftJoin(starBankUsersAccounts, eq(starBankAccounts.id, starBankUsersAccounts.accountId))
            .leftJoin(smartrotomUsers, eq(starBankUsersAccounts.uuid, uuid))
            
        if(res.length === 0) {
            return []
        }

        return res
    }

    async createAccount(uuid: string, name: string) {
        if(name.length === 0) {
            this.createMainAccount(uuid);
        }
        return {success: true}
    }

    async createMainAccount(uuid: string) {
        console.log("Creating main account")
       const res = await this.db.getDrizzle().select({id: starBankAccounts.id}).from(starBankAccounts).where(eq(starBankAccounts.name, "PRINCIPAL"))
         if(res.length > 0) {
              return {success: false}
         }
        const res2 = await this.db.getDrizzle().insert(starBankAccounts).values({name: "PRINCIPAL", balance: 0, type: "MAIN"}).execute() as RowDataPacket[];
        const insert = res2[0];
        const res3 = await this.db.getDrizzle().insert(starBankUsersAccounts).values({uuid, accountId: insert.insertId}).execute();
        return {success: true}
    }
}
