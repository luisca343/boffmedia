import { Injectable } from '@nestjs/common';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { App } from './entities/app.entity';
import { MySQL2Service } from '../../_utils/MySQL2Service';

@Injectable()
export class AppsService {
  constructor(
    private db: MySQL2Service,
  ) {}

  async test(){
    let test = await this.db.insertAndReturn<App>('smartrotom_apps', 'INSERT INTO smartrotom_apps SET ?', {name: 'test'}) 
    return test;
  }

  async create(createAppDto: CreateAppDto) {
    const [rows] = await this.db.getConnection().execute('INSERT INTO smartrotom_apps SET ?', [createAppDto]);
    return rows;
  }

  async order(order: {id: number, order: number}[], uuid: string) {
    let test  = await this.db.getConnection().query('DELETE FROM smartrotom_apps_order WHERE uuid = ?', [uuid]);
    let insert = await this.db.getConnection().query('INSERT INTO smartrotom_apps_order (uuid, app_id, `order`) VALUES ?', [order.map((app) => [uuid, app.id, app.order])]);

    return {insert}
  }

  async findAll() {
    const [rows] = await this.db.getConnection().execute('SELECT * FROM smartrotom_apps');
    return rows;
  }

  async getForPlayer(uuid: string): Promise<App[]> {
    const [rows] = await this.db.getConnection().execute(`
    (SELECT sa.id, sa.url,  sa.name, sa.icon, sao.order as orden FROM smartrotom_apps sa
      LEFT JOIN smartrotom_apps_order sao ON sa.id = sao.app_id
      WHERE sao.uuid = ?)
      UNION ALL
      (SELECT sa.id, sa.url,  sa.name, sa.icon, sa.order as orden FROM smartrotom_apps sa
        WHERE id NOT IN (
          SELECT app_id FROM smartrotom_apps_order sao
          WHERE sao.uuid = ?
        )
      )
      ORDER  BY orden ASC`, [uuid, uuid]
  );

    return <App[]>rows;
  }

  async findOne(id: number) {
    const [rows] = await this.db.getConnection().execute('SELECT * FROM smartrotom_apps WHERE id = ?', [id]);
    return rows[0];
  }

  async update(id: number, updateAppDto: UpdateAppDto) {
    const [rows] = await this.db.getConnection().execute('UPDATE smartrotom_apps SET ? WHERE id = ?', [updateAppDto, id]);
    return rows;
  }

  async remove(id: number) {
    const [rows] = await this.db.getConnection().execute('DELETE FROM smartrotom_apps WHERE id = ?', [id]);
    return rows;
  }
}