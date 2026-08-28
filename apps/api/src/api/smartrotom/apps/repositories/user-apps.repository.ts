import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql, asc } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  RotomUserApp,
  rotomUserApps,
  rotomApps,
} from '@/_db/schema/SmartRotom';
import { IUserAppsRepository } from './interfaces/user-apps-repository.interface';
import { Logger } from 'nestjs-pino';

@Injectable()
export class UserAppsRepository implements IUserAppsRepository {
  constructor(
    private readonly logger: Logger,

    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async findByPlayerUuid(uuid: string): Promise<RotomUserApp[]> {
    return this.db
      .select()
      .from(rotomUserApps)
      .where(eq(rotomUserApps.uuid, uuid));
  }

  async findUserApp(uuid: string, appId: number): Promise<RotomUserApp | null> {
    const result = await this.db
      .select()
      .from(rotomUserApps)
      .where(and(eq(rotomUserApps.uuid, uuid), eq(rotomUserApps.appId, appId)));
    return result[0] || null;
  }

  // `order` is required on purpose. It used to default to 999, which is past the
  // end of the grid, so a caller that forgot it created a row the dock never shows.
  async addUserApp(
    uuid: string,
    appId: number,
    order: number,
  ): Promise<RotomUserApp> {
    const _result = await this.db.insert(rotomUserApps).values({
      uuid,
      appId,
      order,
    } as RotomUserApp);

    const insertedApp = await this.findUserApp(uuid, appId);
    if (!insertedApp) {
      throw new Error('Failed to create user app');
    }
    return insertedApp;
  }

  async removeUserApp(uuid: string, appId: number): Promise<boolean> {
    const result = await this.db
      .delete(rotomUserApps)
      .where(and(eq(rotomUserApps.uuid, uuid), eq(rotomUserApps.appId, appId)));
    return result[0].affectedRows > 0;
  }

  async updateOrder(uuid: string, appId: number, order: number): Promise<void> {
    await this.db
      .update(rotomUserApps)
      .set({ order } as RotomUserApp)
      .where(and(eq(rotomUserApps.uuid, uuid), eq(rotomUserApps.appId, appId)));
  }

  async getAppsForPlayer(uuid: string): Promise<any[]> {
    return this.db
      .select({
        id: rotomApps.id,
        url: rotomApps.url,
        name: rotomApps.name,
        // The WHERE below already restricts to this player's rows, so `order` is
        // never null here and the fallback is unreachable; it is 0 rather than the
        // old 999 so no code path can produce an off-grid slot.
        order: sql`COALESCE(${rotomUserApps.order}, 0)`.as('order'),
        is_user_app:
          sql`CASE WHEN ${rotomUserApps.uuid} IS NOT NULL THEN 1 ELSE 0 END`.as(
            'is_user_app',
          ),
      })
      .from(rotomApps)
      .leftJoin(
        rotomUserApps,
        and(
          eq(rotomApps.id, rotomUserApps.appId),
          eq(rotomUserApps.uuid, uuid),
        ),
      )
      .where(and(eq(rotomApps.active, true), eq(rotomUserApps.uuid, uuid)))
      .orderBy(asc(rotomUserApps.order));
  }
}
