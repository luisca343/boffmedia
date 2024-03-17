import { Injectable } from '@nestjs/common';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateInviteDto } from './dto/update-invite.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Invite } from './entities/invite.entity';
import { Repository } from 'typeorm';
import { RegisterDataDto } from './dto/register-data.dto';
import { UsersService } from '../../boffmedia/users/users.service';
import { CreateUserDto } from '../../boffmedia/users/dto/create-user.dto';
import { shortToLongUUID } from '../../_utils/stringUtils';
import { SmartRotomUsersService } from '../../smartrotom/users/users.service';
import { SmartrotomUser } from '../../smartrotom/users/entities/user.entity';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { CreateSmartrotomUserDto } from '@/smartrotom/users/dto/create-user.dto';

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
    const [rows] = await this.db.getConnection().execute('SELECT * FROM wingull_invites WHERE id = ?', [id]);
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

    console.log("UUID is: ", uuid);
    
    let boffMediaUser = {
      email: createInviteDto.email,
      password: createInviteDto.password,
      username: createInviteDto.username,
      mc_uuid: uuid,
    } as CreateUserDto;
    

    let smartRotomUser = {
      uuid,
      username: createInviteDto.username,
    } as CreateSmartrotomUserDto

    const smart = await this.smartRotomUsersService.create(smartRotomUser);
    console.log(smart);
      if ('error' in smart) {
        console.log("Error creating user in SmartRotom");
        return smart;
      }

    const boff = await this.usersService.create(boffMediaUser, smart);
    if ('error' in boff) {
      console.log("Error creating user in BoffMedia");
      return boff;
    }
    
    let ret = await this.db.getConnection().execute('UPDATE wingull_invites SET usedAt = ? WHERE id = ?', [new Date(), id]);
    console.log("User created successfully");
    return ret;
  }
}
