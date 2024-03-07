import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException } from '@nestjs/common';
import { AppsService } from './apps.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { App } from './entities/app.entity';

@Controller('/smartrotom/apps')
export class AppsController {
  constructor(
    @InjectRepository(App)
    private appsRepository: Repository<App>,
    ) {}

  @Post()
  async create(@Body() createAppDto: CreateAppDto) {
    return this.appsRepository.save(createAppDto);
  }

  @Get()
  findAll() {
    return this.appsRepository.find();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.appsRepository.findOneBy({id});
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateAppDto: UpdateAppDto) {
    return this.appsRepository.update(+id, updateAppDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.appsRepository.softDelete(id);
  }
}
