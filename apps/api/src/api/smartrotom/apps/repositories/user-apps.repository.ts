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

  async findUserApp(
    uuid: string,
    appId: number,
  ): Promise<RotomUserApp | null> {
    const result = await this.db
      .select()
      .from(rotomUserApps)
      .where(
        and(
          eq(rotomUserApps.uuid, uuid),
          eq(rotomUserApps.appId, appId),
        ),
      );
    return result[0] || null;
  }

  async addUserApp(
    uuid: string,
    appId: number,
    order: number = 999,
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
      .where(
        and(
          eq(rotomUserApps.uuid, uuid),
          eq(rotomUserApps.appId, appId),
        ),
      );
    return result[0].affectedRows > 0;
  }

  async updateOrder(uuid: string, appId: number, order: number): Promise<void> {
    await this.db
      .update(rotomUserApps)
      .set({ order } as RotomUserApp)
      .where(
        and(
          eq(rotomUserApps.uuid, uuid),
          eq(rotomUserApps.appId, appId),
        ),
      );
  }

  async resetOrderExcept(uuid: string, excludeAppIds: number[]): Promise<void> {
    this.logger.log(
      'Resetting order for user:',
      uuid,
      'excluding apps:',
      excludeAppIds,
    );
    if (excludeAppIds.length === 0) {
      await this.db
        .update(rotomUserApps)
        .set({ order: 999 } as RotomUserApp)
        .where(eq(rotomUserApps.uuid, uuid));
    } else {
      await this.db
        .update(rotomUserApps)
        .set({ order: 999 } as RotomUserApp)
        .where(
          and(
            eq(rotomUserApps.uuid, uuid),
            sql`${rotomUserApps.appId} NOT IN (${excludeAppIds})`,
          ),
        );
    }
  }

  async getAppsForPlayer(uuid: string): Promise<any[]> {
    return this.db
      .select({
        id: rotomApps.id,
        url: rotomApps.url,
        name: rotomApps.name,
        order: sql`COALESCE(${rotomUserApps.order}, 999)`.as('order'),
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
      .where(
        and(eq(rotomApps.active, 1), eq(rotomUserApps.uuid, uuid)),
      )
      .orderBy(asc(rotomUserApps.order));
  }
}
