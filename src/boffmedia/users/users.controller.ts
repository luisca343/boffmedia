import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SmartRotomUsersService } from '@/smartrotom/users/users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly smartrotomUsersService: SmartRotomUsersService
  
  ) {}

  @Post('register')
  async register(@Body() createUserDto: any) {
    console.log('Registrando usuario en BoffMedia');
    const user = JSON.parse(createUserDto.body) as CreateUserDto;
    return await this.usersService.createFromBoffMedia(user);
  }

  @Post("login")
  async login(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.validateUser(createUserDto.username, createUserDto.password);
    if (!user) return { error: 'Usuario o contraseña incorrectos' };
    console.log('Usuario:', user);
    return user;
  }


  @Post("loginmc")
  async loginMC(@Body() loginMC: {username: string, uuid: string, world: string}) {
    if(loginMC.world !== process.env.MC_WORLD) return {error: 'Este login no funciona'};
    let usuario = await this.usersService.findFullUserWithUUID(loginMC.uuid);
    if(!usuario) {
      let usuario = await this.smartrotomUsersService.create(loginMC);
      return {error: 'Usuario creado en SmartRotom'};
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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Post('google/callback')
  async googleAuthRedirect(@Body() body) {
    try {
      const user = await this.usersService.findByEmail(body.email);
      
      if (user) return {user, ok: true};
      const newUser = await this.usersService.createFromGoogle(body);
      return {user: newUser, ok: true};
    } catch (error) {
      console.error('Error in Google callback:', error);
      return JSON.stringify({ error: 'An error occurred during Google authentication' });
    }
  }
}
