import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { In, Repository, getConnection } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateSmartrotomUserDto } from 'src/smartrotom/users/dto/create-user.dto';
import { SmartrotomUser } from 'src/smartrotom/users/entities/user.entity';
import { SmartRotomUsersService } from 'src/smartrotom/users/users.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private smartRotomUsersService: SmartRotomUsersService,
  ) {}

  async create(createUserDto: CreateUserDto, smartrotomUser: SmartrotomUser) {
    let user = new User();
    user.email = createUserDto.email;
    user.username = createUserDto.username;
    const hash = await bcrypt.hash(createUserDto.password, 12);
    user.password = hash;
    user.smartRotomUser = smartrotomUser;
    //user.mc_uuid = createUserDto.mc_uuid;

    
    let existingUser = await this.usersRepository.findOne({ where: { username: user.username } });
    if (existingUser) {
      return { error: 'El usuario ya existe' };
    }

    console.log(existingUser)
    
    console.log(createUserDto)
    
    let alreadyLinked = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.smartRotomUser', 'smartRotomUser')
      .where('smartRotomUser.uuid = :uuid', { uuid: createUserDto.mc_uuid })
      .getOne();

    if (alreadyLinked) {
      return { error: 'El usuario de Minecraft ya está vinculado a una cuenta' };
    }


    
    let res = await this.usersRepository.save(user)
    console.log(`Se ha creado el usuario de BoffMedia ${res.username} con el usuario de SmartRotom ${res.smartRotomUser.username}`)
    return res

    return { error: 'El usuario ya existe' };
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  findFromUserName(username: string) {
    return this.usersRepository.findOne({ where: { username: username } });
  }

  async findWithSmartRotom(username: string) {
    return await this.usersRepository.createQueryBuilder('user')
    .leftJoinAndSelect('user.smartRotomUser', 'smartRotomUser')
    .where('user.username = :username', { username })
    .getOne();
  }
  
  async findWithUUID(uuid: string) {
    console.log(uuid)
    const result = await this.usersRepository.query(`SELECT bu.username as boff_name, bu.email, su.uuid, su.username as mc_name, su.world as world  FROM smartrotom_users su
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

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
