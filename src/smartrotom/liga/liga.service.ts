import { smartRotomReplays } from '@/_db/schema/SmartRotom';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

@Injectable()
export class LigaService {
    constructor(
        @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
    ) {}

    async getReplay(id: number) {
        return await this.db.select().from(smartRotomReplays).where(eq(smartRotomReplays.id, id));
    }

}
