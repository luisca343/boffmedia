import { smartRotomReplays } from '@/_db/schema/SmartRotom';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

@Injectable()
export class LigaService {
    constructor(
        private db: MySQL2Service,
    ) {}

    async getReplay(id: number) {
        return await this.db.getDrizzle().select().from(smartRotomReplays).where(eq(smartRotomReplays.id, id));
    }

}
