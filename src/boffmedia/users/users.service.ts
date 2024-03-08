import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    let user = new User();
    user.email = createUserDto.email;
    user.username = createUserDto.username;
    const hash = await bcrypt.hash(createUserDto.password, 12);
    user.password = hash;
    user.mc_uuid = createUserDto.mc_uuid;

    let existingUser = await this.usersRepository.findOne({ where: { username: user.username } });
    if (existingUser) {
      return { error: 'El usuario ya existe' };
    }
    let alreadyLinked = await this.usersRepository.findOne({ where: { mc_uuid: user.mc_uuid } });
    if (alreadyLinked) {
      return { error: 'El usuario de Minecraft ya está vinculado a una cuenta' };
    }

    let res = await this.usersRepository.save(user)
    console.log(`Se ha creado el usuario de BoffMedia ${res.username}`)
    return res
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
