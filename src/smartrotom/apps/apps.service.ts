import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { MySQL2Service } from '../../_utils/MySQL2Service';
import { SmartRotomApp, smartrotomApps, smartrotomUserApps } from '@/_db/schema/SmartRotom';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class AppsService {
  constructor(
    private db: MySQL2Service,
  ) {}

  async findAll() {
    try {
      const result = await this.db.getDrizzle().select().from(smartrotomApps);
      return result;
    } catch (error) {
      throw new HttpException('Failed to find all apps', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async create(appData: CreateAppDto) {
    try {
      const result = await this.db.getDrizzle().insert(smartrotomApps).values(appData);
      return result[0];
    } catch (error) {
      throw new HttpException('Failed to create app', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async order(order: { id: number, order: number }[], uuid: string) {
    try {
      await this.db.getDrizzle().delete(smartrotomUserApps).where(eq(smartrotomUserApps.uuid, uuid));

      const values = order.map((app) => ({ uuid, appId: app.id, order: app.order }));
      const insert = await this.db.getDrizzle().insert(smartrotomUserApps).values(values);

      return { insert };
    } catch (error) {
      throw new HttpException('Failed to order apps', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getForPlayer(uuid: string) {
    try {
      if (!uuid) return [];
      const result = await this.db.getDrizzle().execute(sql`
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

      const apps = result[0] as unknown as SmartRotomApp[];
      return apps;
    } catch (error) {
      throw new HttpException('Failed to get apps for player', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number) {
    try {
      const result = await this.db.getDrizzle().select().from(smartrotomApps).where(eq(smartrotomApps.id, id));
      return result[0];
    } catch (error) {
      throw new HttpException('Failed to find app', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, updateAppDto: UpdateAppDto) {
    try {
      const result = await this.db.getDrizzle().update(smartrotomApps).set(updateAppDto).where(eq(smartrotomApps.id, id));
      return result[0];
    } catch (error) {
      throw new HttpException('Failed to update app', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(id: number) {
    try {
      const result = await this.db.getDrizzle().delete(smartrotomApps).where(eq(smartrotomApps.id, id));
      return result[0];
    } catch (error) {
      throw new HttpException('Failed to remove app', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}