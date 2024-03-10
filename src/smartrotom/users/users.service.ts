import { Injectable } from '@nestjs/common';
import { CreateSmartrotomUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SmartrotomUser } from './entities/user.entity';
import { MySQL2Service } from '../../MySQL2Service';
import { RowDataPacket } from 'mysql2';

@Injectable()
export class SmartRotomUsersService {
  constructor(
    private db: MySQL2Service,
  ) {}

  async create(user: CreateSmartrotomUserDto) {
    const [existingUser] = await this.db.getConnection().execute('SELECT * FROM smartrotom_users WHERE uuid = ?', [user.uuid]);
    if (existingUser) {
      return { error: 'El usuario ya existe' };
    }

    await this.db.getConnection().execute('INSERT INTO smartrotom_users SET ?', [user]);
    const [newUser] = await this.db.query<SmartrotomUser>('SELECT * FROM smartrotom_users WHERE uuid = ?', [user.uuid]);
      
    console.log(`Se ha creado el usuario de SmartRotom ${newUser.username}`)
    return newUser;
  }

  async findAll(): Promise<SmartrotomUser[]> {
    const [rows] = await this.db.getConnection().query('SELECT * FROM smartrotom_users');
    return <SmartrotomUser[]>rows;
  }

  async findOne(uuid: string) {
    const [rows] = await this.db.getConnection().execute('SELECT * FROM smartrotom_users WHERE uuid = ?', [uuid]);
    return rows[0];
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const [rows] = await this.db.getConnection().execute('UPDATE smartrotom_users SET ? WHERE id = ?', [updateUserDto, id]);
    return rows;
  }

  async remove(id: number) {
    const [rows] = await this.db.getConnection().execute('DELETE FROM smartrotom_users WHERE id = ?', [id]);
    return rows;
  }
}