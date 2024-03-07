import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SmartrotomUser } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(SmartrotomUser)
    private appsRepository: Repository<SmartrotomUser>,
  ) {}
  
  create(createUserDto: CreateUserDto) {
    const user = this.appsRepository.create(createUserDto);
    return this.appsRepository.save(user);
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(uuid: string) {
    return this.appsRepository.findOne({ where: { uuid } });
}

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
