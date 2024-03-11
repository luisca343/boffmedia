import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { error } from 'console';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    // TODO: CREATE STANDALONE BOFFMEDIA USER
  }


  @Post("login")
  async login(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.validateUser(createUserDto.username, createUserDto.password);
    if (!user) return { error: 'Usuario o contraseña incorrectos' };
    return user;
  }


  @Post("loginmc")
  async loginMC(@Body() loginMC: {username: string, uuid: string, world: string}) {
    if(loginMC.world !== process.env.MC_WORLD) return {error: 'Este login no funciona'};
    
    let usuario = await this.usersService.findFullUserWithUUID(loginMC.uuid);
    if(!usuario) return { error: 'Usuario no encontrado' };
    console.log(usuario);
    return usuario;
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
