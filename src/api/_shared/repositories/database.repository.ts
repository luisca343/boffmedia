import { Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

export abstract class DatabaseRepository {
  constructor(
    @Inject(DRIZZLE) protected db: MySql2Database<Record<string, never>>,
  ) {}
}