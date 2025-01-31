import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { SmartRotomApp, smartrotomApps, SmartRotomUserApp, smartrotomUserApps } from '@/_db/schema/SmartRotom';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';

@Injectable()
export class AppsService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
  ) {}
  
  async findAll(): Promise<SmartRotomApp[]> {
    try {
      const [apps, countResult] = await Promise.all([
        this.db.select().from(smartrotomApps).execute(),
        this.db.select({ count: sql`count(*)` }).from(smartrotomApps).execute()
      ]);
      
      if (!countResult || !countResult[0] || typeof countResult[0].count === 'undefined') {
        throw new Error('Count result is invalid');
      }

      const total = Number(countResult[0].count);
      return apps;
    } catch (error) {
      throw new HttpException(`Failed to find apps: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async create(appData: CreateAppDto): Promise<SmartRotomApp> {
    try {
      const [result] = await this.db.insert(smartrotomApps).values(appData);
      if (!result.insertId) {
        throw new Error('Failed to insert app');
      }
      return this.findOne(result.insertId);
    } catch (error) {
      throw new HttpException(`Failed to create app: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async order(order: { id: number | string; order: number }[], uuid: string): Promise<{ success: boolean }> {
    const drizzle = this.db
    try {
      await drizzle.transaction(async (tx) => {
        // Fetch existing apps for the player
        const existingApps = await tx.select().from(smartrotomUserApps).where(eq(smartrotomUserApps.uuid, uuid))

        // Create a set of existing app IDs for quick lookup
        const existingAppIds = new Set(existingApps.map((app) => app.appId))

        // Filter out any apps that are not in the existing set
        const validOrder = order.filter((app) => existingAppIds.has(Number(app.id)))

        // Update the order of existing apps
        for (const app of validOrder) {
          await tx
            .update(smartrotomUserApps)
            .set({ order: app.order } as SmartRotomUserApp)
            .where(and(eq(smartrotomUserApps.uuid, uuid), eq(smartrotomUserApps.appId, Number(app.id))))
        }

        await tx
          .update(smartrotomUserApps)
          .set({ order: 999 } as SmartRotomUserApp)
          .where(
            and(
              eq(smartrotomUserApps.uuid, uuid),
              sql`${smartrotomUserApps.appId} NOT IN (${validOrder.map((app) => Number(app.id))})`,
            ),
          )
      })
      return { success: true }
    } catch (error) {
      throw new HttpException(`Failed to order apps: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async getForPlayer(uuid: string): Promise<SmartRotomApp[]> {
    try {
      if (!uuid) return []
      const result = await this.db.execute(sql`
      SELECT DISTINCT sa.id, sa.url, sa.name, 
        COALESCE(sao.order, 999) as orden,
        CASE WHEN sao.uuid IS NOT NULL THEN 1 ELSE 0 END as is_user_app
      FROM ${smartrotomApps} sa
      LEFT JOIN ${smartrotomUserApps} sao ON sa.id = sao.app_id AND sao.uuid = ${uuid}
      WHERE sa.active = 1 OR sao.uuid = ${uuid}
      ORDER BY is_user_app DESC, orden ASC, sa.name ASC
    `)

      return result[0] as unknown as SmartRotomApp[]
    } catch (error) {
      throw new HttpException(`Failed to get apps for player: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async addAppToPlayer(uuid: string, appId: number): Promise<{ success: boolean }> {
    try {
      if (!uuid || !appId) {
        throw new HttpException("Invalid uuid or appId", HttpStatus.BAD_REQUEST)
      }

      // Check if the app exists and is active
      const [app] = await this.db
        .select()
        .from(smartrotomApps)
        .where(and(eq(smartrotomApps.id, appId), eq(smartrotomApps.active, 0)))

      if (!app) {
        throw new HttpException("App not found or already active", HttpStatus.NOT_FOUND)
      }

      // Check if the app is already in the player's list
      const [existingUserApp] = await this.db
        .select()
        .from(smartrotomUserApps)
        .where(and(eq(smartrotomUserApps.uuid, uuid), eq(smartrotomUserApps.appId, appId)))

      if (existingUserApp) {
        throw new HttpException("App already added to player", HttpStatus.CONFLICT)
      }

      // Insert the new app for the player
      await this.db.insert(smartrotomUserApps).values({
        uuid,
        appId,
        order: 999,
      } as SmartRotomUserApp
    )

      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(`Failed to add app to player: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async removeAppFromPlayer(uuid: string, appId: number): Promise<{ success: boolean }> {
    try {
      if (!uuid || !appId) {
        throw new HttpException("Invalid uuid or appId", HttpStatus.BAD_REQUEST)
      }

      const result = await this.db
        .delete(smartrotomUserApps)
        .where(and(eq(smartrotomUserApps.uuid, uuid), eq(smartrotomUserApps.appId, appId)))

      if (result[0].affectedRows === 0) {
        throw new HttpException("App not found in player's list", HttpStatus.NOT_FOUND)
      }

      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(`Failed to remove app from player: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async findOne(id: number): Promise<SmartRotomApp | null> {
    try {
      const [result] = await this.db.select().from(smartrotomApps).where(eq(smartrotomApps.id, id));
      return result || null;
    } catch (error) {
      throw new HttpException(`Failed to find app: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, updateAppDto: UpdateAppDto): Promise<SmartRotomApp | null> {
    try {
      await this.db.update(smartrotomApps).set(updateAppDto).where(eq(smartrotomApps.id, id));
      return this.findOne(id);
    } catch (error) {
      throw new HttpException(`Failed to update app: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(id: number): Promise<{ success: boolean }> {
    try {
      const result = await this.db.delete(smartrotomApps).where(eq(smartrotomApps.id, id));
      if (result[0].affectedRows === 0) {
        throw new HttpException('App not found', HttpStatus.NOT_FOUND);
      }
      return { success: true };
    } catch (error) {
      throw new HttpException(`Failed to remove app: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}