import { Injectable } from '@nestjs/common';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { Repository, UpdateResult } from 'typeorm';
import { App } from './entities/app.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AppsService {
  constructor(
    @InjectRepository(App)
    private appsRepository: Repository<App>,
  ) {}

  create(createAppDto: CreateAppDto) {
    return this.appsRepository.save(createAppDto);
  }

  findAll(): Promise<App[]> {
    return this.appsRepository.find();
  }

  findOne(id: number) {
    return this.appsRepository.findOneBy({id});
  }

  update(id: number, updateAppDto: UpdateAppDto): Promise<UpdateResult> {
    return this.appsRepository.update(id, updateAppDto);
  }

  async remove(id: number): Promise<UpdateResult>  {
    return await this.appsRepository.softDelete(id);
  }
}
