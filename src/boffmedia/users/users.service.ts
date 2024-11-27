import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import {  smartrotomUsers } from '@/_db/schema/SmartRotom';
import { cosineDistance, eq, or } from 'drizzle-orm';
import { BoffMediaUser, boffMediaRoles, boffMediaUserRoles, boffMediaUsers } from '@/_db/schema/BoffMedia';
import { SmartRotomUser } from '@/_db/schema/SmartRotom';
import { error } from 'console';



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

  
  async createFromBoffMedia(boffMediaUser: Partial<BoffMediaUser>) {
    if (!boffMediaUser.password || boffMediaUser.password.trim() === '') {
        throw new BadRequestException('Password is required');
    }

    console.log('Creando usuario en BoffMedia v2');

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(boffMediaUser.password, salt);

        console.log('Creando usuario en BoffMedia', salt, hash);

        const user = {
            email: boffMediaUser.email,
            username: boffMediaUser.username,
            password: hash,
            uuid: boffMediaUser.uuid
        };

        console.log('Creando usuario en BoffMedia', user);

        const result = await this.db.getDrizzle().insert(boffMediaUsers).values(user as BoffMediaUser).execute();
        
        // Remove the password from the returned user object
        const { password, ...userWithoutPassword } = user;
        return { ...userWithoutPassword, id: result[0].insertId, ok: true };
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return { error: 'Nombre de usuario o email ya en uso' };
        }
        if (error instanceof BadRequestException) {
            throw error;
        }
        throw new Error('Error creating user: ' + error.message);
    }
}
  async create(boffMediaUser: BoffMediaUser, smartrotomUser: SmartRotomUser) {
    console.log('Creando usuario en BoffMedia', boffMediaUser);
    const hash = await bcrypt.hash(boffMediaUser.password, 12);
    const user = {
      email: boffMediaUser.email,
      username: boffMediaUser.username,
      password: hash
    };
    const existe = await this.db.getDrizzle().select().from(boffMediaUsers).where(or(eq(boffMediaUsers.uuid, boffMediaUser.uuid), eq(boffMediaUsers.username, boffMediaUser.username)));
    console.log(existe);
    
    

    if(existe.length > 0) return {error: "El usuario ya existe"} 
    console.log('El usuario BOFF no existe, creando...'); 
    
    const boffInsert = await this.db.getDrizzle().insert(boffMediaUsers).values({...user, uuid: boffMediaUser.uuid} as BoffMediaUser).execute();
    const newUser = await this.findFullUserWithName(boffMediaUser.username);
    return newUser;
  }

  async findAll() {
    const [rows] = await this.db.getConnection().query('SELECT * FROM boffmedia_users');
    return <BoffMediaUser[]>rows;
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
    const users = await this.db.getDrizzle().select().from(boffMediaUsers)
      .leftJoin(smartrotomUsers, eq(boffMediaUsers.uuid, smartrotomUsers.uuid))
      .where(eq(boffMediaUsers.username, username));
    
    return users[0];
  }

  async getUserRoles(userId: number) {
    const data = await this.db.getDrizzle().select({role: boffMediaRoles.name}).from(boffMediaUserRoles)
      .leftJoin(boffMediaRoles, eq(boffMediaRoles.id, boffMediaUserRoles.roleId))
      .where(eq(boffMediaUserRoles.userId, userId));

      const roles = data.map((d: {role: string}) => d.role);

      return roles;
  }

  async validateUser(username: string, password: string): Promise<SessionUser | null> {
    const user = await this.findFullUserWithName(username);
    if (!user) {
      return null;
    }
  
    const match = await bcrypt.compare(password, user.boffmedia_users.password);
    if(!match) return null;

    let userToReturn = this.getSessionUser(user);

    return userToReturn
  }

  
  async findFullUserWithUUID(uuid: string) {
    let test = await this.db.getDrizzle().select().from(smartrotomUsers)
    .leftJoin(boffMediaUsers, eq(boffMediaUsers.uuid, smartrotomUsers.uuid))
    .where(eq(smartrotomUsers.uuid, uuid))

    if(test.length === 0) return null;

    let res = test[0];
    let user = this.getSessionUser(res);

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


  async getSessionUser({boffmedia_users, rotom_users}: {boffmedia_users: BoffMediaUser, rotom_users: SmartRotomUser}){
    const roles = await this.getUserRoles(boffmedia_users.id);

    return {
      id: boffmedia_users?.id,
      name: boffmedia_users?.username,
      email: boffmedia_users?.email,
      roles,
      smartRotomUser: {
        username: rotom_users?.username,
        uuid: rotom_users?.uuid,
        world: rotom_users?.world
      }
    } as SessionUser;
  }

  async findByEmail(email: string): Promise<SessionUser | null> {
    let test = await this.db.getDrizzle().select().from(boffMediaUsers)
    .leftJoin(smartrotomUsers, eq(boffMediaUsers.uuid, smartrotomUsers.uuid))
    .where(eq(boffMediaUsers.email, email))

    if(test.length === 0) return null;

    let res = test[0];
    let user = this.getSessionUser(res);

    return user;
  }

  async createFromGoogle(googleUser: any): Promise<SessionUser> {
    console.log('Creating user from Google:', googleUser);
    const exists = await this.db.getDrizzle().select().from(boffMediaUsers)
    .leftJoin(smartrotomUsers, eq(boffMediaUsers.uuid, smartrotomUsers.uuid))
    .where(eq(boffMediaUsers.email, googleUser.email));

    if(exists.length > 0) {
      console.log('User already exists:', exists[0]);
      return this.getSessionUser(exists[0]);
    }
    


    try {
      const user = {
        email: googleUser.email,
        username: googleUser.email.split('@')[0], // Generate a username from email
        password: '', // We don't need a password for Google auth
        uuid: null, // You may want to generate a UUID here
      };
  
      const result = await this.db.getDrizzle().insert(boffMediaUsers).values(user as BoffMediaUser).execute();
      console.log('User created:', result);
      const newUser = await this.findByEmail(user.email);
      console.log('New user:', newUser);
      return newUser;
      
    } catch (error) {
      console.error('Error creating user from Google:', error);
      throw error;
    }
  }
  
}


type SessionUser = {
  name: string,
  email: string,
  smartRotomUser: {
    username: string,
    uuid: string,
    world: string
  }
}