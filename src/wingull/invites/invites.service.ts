import { Injectable } from '@nestjs/common';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateInviteDto } from './dto/update-invite.dto';
import { RegisterDataDto } from './dto/register-data.dto';
import { UsersService } from '@api/boffmedia/users/users.service';
import { shortToLongUUID } from '../../_utils/stringUtils';
import { SmartRotomUsersService } from '@api/smartrotom/users/users.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { BoffMediaUser } from '@/_db/schema/BoffMedia';
import { SmartRotomUser } from '@/_db/schema/SmartRotom';
import { Invite } from '@/_db/schema/Wingull';

@Injectable()
export class InvitesService {
  constructor(
    private db: MySQL2Service,
    private usersService: UsersService,
    private smartRotomUsersService: SmartRotomUsersService
  ) {}
  

  async create(createInviteDto: CreateInviteDto) {
    await this.db.getConnection().execute('INSERT INTO wingull_invites SET ?', [createInviteDto]);
    const [newInvite] = await this.db.query<Invite>('SELECT * FROM wingull_invites WHERE id = LAST_INSERT_ID()');
    return newInvite;
  }

  async findAll() {
    const [rows] = await this.db.getConnection().query('SELECT * FROM wingull_invites');
    return <Invite[]>rows;
  }

  async findOne(id: string) {
    const [rows] = await this.db.getConnection().execute('SELECT id, uuid, username, created_at as createdAt, used_at as usedAt, deleted_at as deletedAt FROM wingull_invites WHERE id = ?', [id]);
    return rows[0];
  }

  async update(id: number, updateInviteDto: UpdateInviteDto) {
    const [rows] = await this.db.getConnection().execute('UPDATE wingull_invites SET ? WHERE id = ?', [updateInviteDto, id]);
    return rows;
  }

  async remove(id: number) {
    const [rows] = await this.db.getConnection().execute('DELETE FROM wingull_invites WHERE id = ?', [id]);
    return rows;
  }
  
  async register(id: string, createInviteDto: RegisterDataDto) {
    let [invite] = await this.db.query<Invite>('SELECT * FROM wingull_invites WHERE id = ?', [id]) 

    let test = await (await fetch(`https://api.mojang.com/users/profiles/minecraft/${createInviteDto.mc_username}`)).json()
    if(!test.id) return {error: "Invalid username"};

    let shortUUID = test.id;
    let uuid = shortToLongUUID(shortUUID);

    
    let boffMediaUser = {
      email: createInviteDto.email,
      password: createInviteDto.password,
      username: createInviteDto.username,
      uuid: uuid,
    } as BoffMediaUser;
    

    let smartRotomUser = {
      uuid,
      username: createInviteDto.username,
    } as SmartRotomUser

    const smart = await this.smartRotomUsersService.create(smartRotomUser);
      if ('error' in smart) {
        console.log("Error creating user in SmartRotom");
        return smart;
      }

    const boff = await this.usersService.create(boffMediaUser, smart);
    if ('error' in boff) {
      console.log("Error creating user in BoffMedia");
      return boff;
    }
    
    let ret = await this.db.getConnection().execute('UPDATE wingull_invites SET used_at = ? WHERE id = ?', [new Date(), id]);
    console.log("User created successfully");
    return ret;
  }
}
