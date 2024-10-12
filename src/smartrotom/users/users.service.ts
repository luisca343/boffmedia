import { Injectable } from '@nestjs/common';
import { CreateSmartrotomUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MySQL2Service } from '../../_utils/MySQL2Service';
import { SmartRotomUser, smartrotomUsers } from '@/_db/schema/SmartRotom';

@Injectable()
export class SmartRotomUsersService {
  constructor(
    private db: MySQL2Service,
  ) {}

  async create(user: CreateSmartrotomUserDto) {
    console.log('Creando usuario en SmartRotom', user);
    const existe = await this.findOne(user.uuid);
    if(existe) return existe;
    console.log('El usuario no existe, creando...');
    const insert = await this.db.getDrizzle().insert(smartrotomUsers).values({uuid: user.uuid, username: user.username});
    const usuario = await this.findOne(user.uuid);
    console.log('Usuario creado en SmartRotom', usuario);
    /*
    const [existingUser] = await this.db.getConnection().execute('SELECT * FROM rotom_users WHERE uuid = ?', [user.uuid]);
    if (Array.isArray(existingUser) && existingUser.length > 0) {
      return { error: 'El usuario ya existe' };
    }

    const keys = Object.keys(user).join(', ');
    const values = Object.values(user);
    const placeholders = values.map(() => '?').join(', ');
    
    const query = `INSERT INTO rotom_users (${keys}) VALUES (${placeholders})`;
    
    await this.db.getConnection().execute(query, values);
    const [newUser] = await this.db.query<SmartrotomUser>('SELECT * FROM rotom_users WHERE uuid = ?', [user.uuid]);
      
    console.log(`Se ha creado el usuario de SmartRotom ${newUser.username}`)
    return newUser;*/
    return usuario
  }

  async findAll(): Promise<SmartRotomUser[]> {
    const [rows] = await this.db.getConnection().query('SELECT * FROM rotom_users');
    return <SmartRotomUser[]>rows;
  }

  async findOne(uuid: string) {
    const [rows] = await this.db.getConnection().execute('SELECT * FROM rotom_users WHERE uuid = ?', [uuid]);
    return rows[0];
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const [rows] = await this.db.getConnection().execute('UPDATE rotom_users SET ? WHERE id = ?', [updateUserDto, id]);
    return rows;
  }

  async remove(id: number) {
    const [rows] = await this.db.getConnection().execute('DELETE FROM rotom_users WHERE id = ?', [id]);
    return rows;
  }
}