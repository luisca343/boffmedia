import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { RotomApp, rotomApps } from '@/_db/schema/SmartRotom';
import { CreateAppDto } from '../dto/create-app.dto';
import { UpdateAppDto } from '../dto/update-app.dto';
import { BaseRepositoryImpl } from '@api/_utils/repositories/base-repository';
import { IAppsRepository } from './interfaces/apps-repository.interface';

@Injectable()
export class AppsRepository
  extends BaseRepositoryImpl<RotomApp, CreateAppDto, UpdateAppDto>
  implements IAppsRepository
{
  constructor(@Inject(DRIZZLE) db: MySql2Database<Record<string, never>>) {
    super(db, rotomApps);
  }

  async create(createAppDto: CreateAppDto): Promise<RotomApp> {
    const result = await this.db.insert(rotomApps).values({
      ...createAppDto,
    });

    return this.findById(result[0].insertId) as Promise<RotomApp>;
  }

  async update(id: number, updateAppDto: UpdateAppDto): Promise<RotomApp> {
    await this.db
      .update(rotomApps)
      .set({
        ...updateAppDto,
      } as RotomApp)
      .where(eq(rotomApps.id, id));

    return this.findById(id) as Promise<RotomApp>;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(rotomApps).where(eq(rotomApps.id, id));
    return result[0].affectedRows > 0;
  }

  async findByUrl(url: string): Promise<RotomApp | null> {
    const result = await this.db
      .select()
      .from(rotomApps)
      .where(eq(rotomApps.url, url));
    return result[0] || null;
  }

  async findActiveApps(): Promise<RotomApp[]> {
    return this.db.select().from(rotomApps).where(eq(rotomApps.active, true));
  }

  async findByActive(active: boolean): Promise<RotomApp[]> {
    return this.db.select().from(rotomApps).where(eq(rotomApps.active, active));
  }
}
