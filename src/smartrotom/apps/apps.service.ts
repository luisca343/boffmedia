import { Injectable } from '@nestjs/common';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { App } from './entities/app.entity';
import { MySQL2Service } from '../../MySQL2Service';

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

  async findAll(): Promise<App[]> {
    const [rows] = await this.db.getConnection().query('SELECT * FROM smartrotom_apps');
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