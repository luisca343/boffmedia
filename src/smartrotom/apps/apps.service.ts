import { Injectable } from '@nestjs/common';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { App } from './entities/app.entity';
import { MySQL2Service } from '../../_utils/MySQL2Service';
import { smartrotomApps, smartrotomUserApps } from '@/_db/schema/SmartRotom';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class AppsService {
  constructor(
    private db: MySQL2Service,
  ) {}

  async test(){
    let test = await this.db.insertAndReturn<App>('rotom_apps', 'INSERT INTO rotom_apps SET ?', {name: 'test'}) 
    return test;
  }

  async create(createAppDto: CreateAppDto) {
    const [rows] = await this.db.getConnection().execute('INSERT INTO rotom_apps SET ?', [createAppDto]);
    return rows;
  }

  async order(order: {id: number, order: number}[], uuid: string) {
    const dlt =  await this.db.getDrizzle().delete(smartrotomUserApps).where(eq(smartrotomUserApps.uuid, uuid));

    const values = order.map((app) => ({uuid, appId: app.id, order: app.order}));

    const insert = await this.db.getDrizzle().insert(smartrotomUserApps).values(values);


    return {insert}
  }

  async findAll() {
    const [rows] = await this.db.getConnection().execute('SELECT * FROM rotom_apps');
    return rows;
  }

  async getForPlayer(uuid: string) {
    if (!uuid) return [];
    const result = await this.db.getDrizzle().execute(sql`
        (SELECT sa.id, sa.url,  sa.name, sao.order as orden FROM rotom_apps sa
          LEFT JOIN rotom_user_apps sao ON sa.id = sao.app_id
          WHERE sao.uuid = ${uuid})
          UNION ALL
          (SELECT sa.id, sa.url,  sa.name, 999 as orden FROM rotom_apps sa
            WHERE id NOT IN (
              SELECT app_id FROM rotom_user_apps sao
              WHERE sao.uuid = ${uuid}
            )
          )
          ORDER  BY orden ASC`);

    const apps = result[0] as unknown as App[];
    return apps;
  }

  async findOne(id: number) {
    const rows = await this.db.query
    return rows[0];
  }

  async update(id: number, updateAppDto: UpdateAppDto) {
    const [rows] = await this.db.getConnection().execute('UPDATE rotom_apps SET ? WHERE id = ?', [updateAppDto, id]);
    return rows;
  }

  async remove(id: number) {
    const [rows] = await this.db.getConnection().execute('DELETE FROM rotom_apps WHERE id = ?', [id]);
    return rows;
  }
}