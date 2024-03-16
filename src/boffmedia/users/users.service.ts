import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { SmartrotomUser } from '../../smartrotom/users/entities/user.entity';
import { MySQL2Service } from '@/MySQL2Service';


type FullUser = {
  boff_name: string,
  email: string,
  uuid: string,
  mc_name: string,
  world: string
}

@Injectable()
export class UsersService {
  constructor(
    private db: MySQL2Service,
  ) {}


  async create(createUserDto: CreateUserDto, smartrotomUser: SmartrotomUser) {
    const hash = await bcrypt.hash(createUserDto.password, 12);

    const user = {
      email: createUserDto.email,
      username: createUserDto.username,
      password: hash,
      smartRotomUser: smartrotomUser,
    };

    const [result] = await this.db.getConnection().execute('SELECT * FROM boffmedia_users WHERE username = ?', [user.username]);
    if (Array.isArray(result) && result.length > 0) {
      return { error: 'El usuario ya existe' };
    }
    await this.db.getConnection().execute(
      'INSERT INTO boffmedia_users (email, username, password, mc_uuid) VALUES (?, ?, ?, ?)', 
      [user.email, user.username, user.password, user.smartRotomUser[0].uuid]
    );
    const [newUser] = await this.db.query<User>('SELECT * FROM boffmedia_users WHERE username = ?', [user.username]);
    

    console.log(`Se ha creado el usuario de BoffMedia ${newUser[0].username} con el usuario de SmartRotom ${user.smartRotomUser.username}`)
    return newUser;
  }

  async findAll() {
    const [rows] = await this.db.getConnection().query('SELECT * FROM boffmedia_users');
    return <User[]>rows;
  }

  async findOne(id: number) {
    const [rows] = await this.db.getConnection().execute('SELECT * FROM boffmedia_users WHERE id = ?', [id]);
    return rows[0];
  }

  async findFromUserName(username: string) {
    const [rows] = await this.db.getConnection().execute('SELECT * FROM boffmedia_users WHERE username = ?', [username]);
    return rows[0];
  }
  
  async findFullUserWithName(username: string) {
    const [rows] = await this.db.getConnection().execute(`
      SELECT user.*, smartRotomUser.username as mc_name, smartRotomUser.uuid
      FROM boffmedia_users user
      LEFT JOIN smartrotom_users smartRotomUser ON user.mc_uuid = smartRotomUser.uuid
      WHERE user.username = ?
    `, [username]);

    return rows[0];
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findFullUserWithName(username);
    if (!user) {
      return null;
    }
  
    const match = await bcrypt.compare(password, user.password);

    console.log(user);
    let userToReturn = {
      username: user.username,
      email: user.email,
      smartRotomUser: {
        username: user?.mc_name,
        uuid: user?.uuid
      }
    } as User;

    console.log(userToReturn);
    return match ? userToReturn : null;
  }

  
  async findFullUserWithUUID(uuid: string) {
    console.log(uuid)
    const [result] = await this.db.query<FullUser>(`SELECT bu.username as boff_name, bu.email, su.uuid, su.username as mc_name, su.world as world  FROM smartrotom_users su
    LEFT JOIN boffmedia_users bu ON su.uuid = bu.mc_uuid
    WHERE uuid = '${uuid}'`);


    let res = result[0];
    let user = new User();
    user.username = res.boff_name;
    user.email = res.email;
    user.smartRotomUser = new SmartrotomUser();
    user.smartRotomUser.username = res.mc_name;
    user.smartRotomUser.uuid = res.uuid;
    user.smartRotomUser.world = res.world;

    return user;

  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const [rows] = await this.db.getConnection().execute('UPDATE boffmedia_users SET ? WHERE id = ?', [updateUserDto, id]);
    return rows;
  }

  async remove(id: number) {
    const [rows] = await this.db.getConnection().execute('DELETE FROM boffmedia_users WHERE id = ?', [id]);
    return rows;
  }
}
