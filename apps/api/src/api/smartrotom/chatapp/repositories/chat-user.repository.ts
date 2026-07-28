import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { rotomUsers } from '@/_db/schema/SmartRotom';

@Injectable()
export class ChatUserRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findUserByUuid(uuid: string): Promise<any | null> {
    const result = await this.db
      .select({
        uuid: rotomUsers.uuid,
        username: rotomUsers.username,
      })
      .from(rotomUsers)
      .where(eq(rotomUsers.uuid, uuid))
      .limit(1);
    return result[0] || null;
  }
}
