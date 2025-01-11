
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ArcadeService {
    constructor(
        @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
      ) {}

    getWordle() {
        return 'wordle';
    }
}
