import { Injectable } from '@nestjs/common';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateInviteDto } from './dto/update-invite.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Invite } from './entities/invite.entity';
import { Repository } from 'typeorm';
import { RegisterDataDto } from './dto/register-data.dto';
import { UsersService } from 'src/boffmedia/users/users.service';
import { CreateUserDto } from 'src/boffmedia/users/dto/create-user.dto';
import { CreateSmartrotomUserDto } from 'src/smartrotom/users/dto/create-user.dto';
import { User } from 'src/boffmedia/users/entities/user.entity';
import { shortToLongUUID } from 'src/utils/stringUtils';
import { SmartRotomUsersService } from 'src/smartrotom/users/users.service';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invite)
    private invitesRepository: Repository<Invite>,
    private usersService: UsersService,
    private smartRotomUsersService: SmartRotomUsersService,
  ) {
    
  }
  create(createInviteDto: CreateInviteDto) {
    return 'This action adds a new invite';
  }

  findAll() {
    return this.invitesRepository.find();
  }

  findOne(id: string) {
    return this.invitesRepository.findOneBy({id});
  }

  update(id: number, updateInviteDto: UpdateInviteDto) {
    return `This action updates a #${id} invite`;
  }

  remove(id: number) {
    return `This action removes a #${id} invite`;
  }
  
  async register(id: string, createInviteDto: RegisterDataDto) {
    let invite = await this.invitesRepository.findOneBy({id});


    let test = await (await fetch(`https://api.mojang.com/users/profiles/minecraft/${createInviteDto.mc_username}`)).json()
    if(!test.id) return {error: "Invalid username"};

    let shortUUID = test.id;
    let uuid = shortToLongUUID(shortUUID);

    
    let boffMediaUser = {
      email: createInviteDto.email,
      password: createInviteDto.password,
      username: createInviteDto.username,
      mc_uuid: uuid,
    } as CreateUserDto;

    let boff = await this.usersService.create(boffMediaUser);
    if ('error' in boff) {
      console.log("Error creating user in BoffMedia");
      return boff;
    }
    
    let smartRotomUser = {
      uuid,
      username: createInviteDto.username,
    } as CreateSmartrotomUserDto

    let smart = await this.smartRotomUsersService.create(smartRotomUser);
    if ('error' in smart) {
      console.log("Error creating user in SmartRotom");
      return smart;
    }
    
    invite.usedAt = new Date();
    return await this.invitesRepository.save(invite);
  }
}
