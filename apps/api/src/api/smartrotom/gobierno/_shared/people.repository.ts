import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { inArray } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { rotomUsers } from '@/_db/schema/SmartRotom';

// One batched lookup against rotom_users to resolve a set of uuids into usernames — every
// gobierno service uses this instead of resolving names one row at a time.
@Injectable()
export class PeopleRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async findUsernames(
    uuids: (string | null | undefined)[],
  ): Promise<Map<string, string>> {
    const unique = Array.from(new Set(uuids.filter((u): u is string => !!u)));
    if (unique.length === 0) return new Map();

    const rows = await this.db
      .select({
        uuid: rotomUsers.uuid,
        username: rotomUsers.username,
      })
      .from(rotomUsers)
      .where(inArray(rotomUsers.uuid, unique));

    return new Map(rows.map((r) => [r.uuid, r.username]));
  }
}
