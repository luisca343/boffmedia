import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {

  }


  @Post("login")
  async login(@Body() createUserDto: CreateUserDto) {
    let user = await this.usersService.findWithSmartRotom(createUserDto.username);

    console.log(user);
    
    
    if(!user) {
      return { error: 'Usuario o contraseña incorrectos' };
    }

    let password = createUserDto.password;
    let bd_password = user.password;

    let match = await bcrypt.compare(password, bd_password);
    if (!match) {
      return { error: 'Usuario o contraseña incorrectos' };
    }
    return {
      username: user.username,
      email: user.email,
      smartRotomUser: {
        username: user.smartRotomUser.username,
        uuid: user.smartRotomUser.uuid
      }
    }
  }


  
  @Post("loginmc")
  async loginMC(@Body() loginMC: {username: string, uuid: string}) {
    let usuario = await this.usersService.findWithUUID(loginMC.uuid);
    if(!usuario) {
      console.log('Usuario no encontrado');
      return { error: 'Usuario no encontrado' };
    }

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
