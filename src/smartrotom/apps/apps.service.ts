import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { SmartRotomApp, smartrotomApps, smartrotomUserApps } from '@/_db/schema/SmartRotom';
import { eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';

@Injectable()
export class AppsService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
  ) {}
  
  async findAll(page: number = 1, limit: number = 10): Promise<{ apps: SmartRotomApp[], total: number }> {
    try {
      const offset = (page - 1) * limit;
      const [apps, countResult] = await Promise.all([
        this.db.select().from(smartrotomApps).limit(limit).offset(offset).execute(),
        this.db.select({ count: sql`count(*)` }).from(smartrotomApps).execute()
      ]);
      
      if (!countResult || !countResult[0] || typeof countResult[0].count === 'undefined') {
        throw new Error('Count result is invalid');
      }

      const total = Number(countResult[0].count);
      return { apps, total };
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

  async order(order: { id: number | string, order: number }[], uuid: string): Promise<{ success: boolean }> {
    const drizzle = this.db;
    try {
      await drizzle.transaction(async (tx) => {
        await tx.delete(smartrotomUserApps).where(eq(smartrotomUserApps.uuid, uuid));

        const values = order
          .filter((app) => typeof app.id === 'number')
          .map((app) => ({ uuid, appId: app.id as number, order: app.order }));
        
        if (values.length > 0) {
          await tx.insert(smartrotomUserApps).values(values);
        }
      });
      return { success: true };
    } catch (error) {
      throw new HttpException(`Failed to order apps: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getForPlayer(uuid: string): Promise<SmartRotomApp[]> {
    try {
      if (!uuid) return [];
      const result = await this.db.execute(sql`
        (SELECT sa.id, sa.url, sa.name, sao.order as orden FROM ${smartrotomApps} sa
          LEFT JOIN ${smartrotomUserApps} sao ON sa.id = sao.app_id
          WHERE sao.uuid = ${uuid})
        UNION ALL
        (SELECT sa.id, sa.url, sa.name, 999 as orden FROM ${smartrotomApps} sa
          WHERE id NOT IN (
            SELECT app_id FROM ${smartrotomUserApps} sao
            WHERE sao.uuid = ${uuid}
          )
        )
        ORDER BY orden ASC
      `);

      return result[0] as unknown as SmartRotomApp[];
    } catch (error) {
      throw new HttpException(`Failed to get apps for player: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
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