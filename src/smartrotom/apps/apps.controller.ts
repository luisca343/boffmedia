import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException } from '@nestjs/common';
import { AppsService } from './apps.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';

@Controller('/smartrotom/apps')
export class AppsController {
  constructor(
    private appsService: AppsService,
  ) {}

  @Get('/test')
  async test(){
    return await this.appsService.test();
  }

  @Post()
  async create(@Body() createAppDto: CreateAppDto) {
    return this.appsService.create(createAppDto);
  }

  @Get()
  findAll() {
    return this.appsService.findAll() ?? {error: 'No se encontraron aplicaciones'};
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.appsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateAppDto: UpdateAppDto) {
    return this.appsService.update(id, updateAppDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.appsService.remove(id);
  }
}
