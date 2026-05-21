import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { smartrotomUsers } from '@/_db/schema/SmartRotom';

@Injectable()
export class ChatUserRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findUserByUuid(uuid: string): Promise<any | null> {
    const result = await this.db
      .select({
        uuid: smartrotomUsers.uuid,
        username: smartrotomUsers.username,
      })
      .from(smartrotomUsers)
      .where(eq(smartrotomUsers.uuid, uuid))
      .limit(1);
    return result[0] || null;
  }
}
