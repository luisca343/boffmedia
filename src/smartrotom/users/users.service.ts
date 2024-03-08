import { Injectable } from '@nestjs/common';
import { CreateSmartrotomUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SmartrotomUser } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SmartRotomUsersService {
  constructor(
    @InjectRepository(SmartrotomUser)
    private smartRotomUsersRepository: Repository<SmartrotomUser>,
  ) {}
  
  async create(user: CreateSmartrotomUserDto) {
    let existingUser = await this.smartRotomUsersRepository.findOne({ where: { uuid: user.uuid } });
    if (existingUser) {
      console.log('El usuario ya existe');
      console.log(existingUser);
      return { error: 'El usuario ya existe' };
    }

    let res = await this.smartRotomUsersRepository.save(user)
    console.log(`Se ha creado el usuario de SmartRotom ${res.username}`)
    return res
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(uuid: string) {
    return this.smartRotomUsersRepository.findOne({ where: { uuid } });
}

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
