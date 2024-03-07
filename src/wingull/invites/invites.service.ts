import { Injectable } from '@nestjs/common';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateInviteDto } from './dto/update-invite.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Invite } from './entities/invite.entity';
import { Repository } from 'typeorm';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invite)
    private invitesRepository: Repository<Invite>,
  ) {}
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
}
