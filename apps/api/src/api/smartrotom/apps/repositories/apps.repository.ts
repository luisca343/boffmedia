import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { SmartRotomApp, smartrotomApps } from '@/_db/schema/SmartRotom';
import { CreateAppDto } from '../dto/create-app.dto';
import { UpdateAppDto } from '../dto/update-app.dto';
import { BaseRepositoryImpl } from '@api/_utils/repositories/base-repository';
import { IAppsRepository } from './interfaces/apps-repository.interface';

@Injectable()
export class AppsRepository
  extends BaseRepositoryImpl<SmartRotomApp, CreateAppDto, UpdateAppDto>
  implements IAppsRepository
{
  constructor(@Inject(DRIZZLE) db: MySql2Database<Record<string, never>>) {
    super(db, smartrotomApps);
  }

  async create(createAppDto: CreateAppDto): Promise<SmartRotomApp> {
    const result = await this.db.insert(smartrotomApps).values({
      ...createAppDto,
    });

    return this.findById(result[0].insertId);
  }

  async update(id: number, updateAppDto: UpdateAppDto): Promise<SmartRotomApp> {
    await this.db
      .update(smartrotomApps)
      .set({
        ...updateAppDto,
      } as SmartRotomApp)
      .where(eq(smartrotomApps.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(smartrotomApps)
      .where(eq(smartrotomApps.id, id));
    return result[0].affectedRows > 0;
  }

  async findByUrl(url: string): Promise<SmartRotomApp | null> {
    const result = await this.db
      .select()
      .from(smartrotomApps)
      .where(eq(smartrotomApps.url, url));
    return result[0] || null;
  }

  async findActiveApps(): Promise<SmartRotomApp[]> {
    return this.db
      .select()
      .from(smartrotomApps)
      .where(eq(smartrotomApps.active, 1));
  }

  async findByActive(active: number): Promise<SmartRotomApp[]> {
    return this.db
      .select()
      .from(smartrotomApps)
      .where(eq(smartrotomApps.active, active));
  }
}
