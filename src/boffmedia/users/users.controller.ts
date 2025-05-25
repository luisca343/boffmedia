import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpStatus, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SmartRotomUsersService } from '@/smartrotom/users/users.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ResponseInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly smartrotomUsersService: SmartRotomUsersService
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User registered successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to register user.' })
  async register(@Body() createUserDto: any) {
    const user = JSON.parse(createUserDto.body) as CreateUserDto;
    return await this.usersService.createFromBoffMedia(user);
  }

  @Post("login")
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User logged in successfully.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to login user.' })
  async login(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.validateUser(createUserDto.username, createUserDto.password);
    if (!user) return { error: 'Usuario o contraseña incorrectos' };
    return {
      data: user,
      statusCode: 200,
      message: 'Usuario encontrado'
    }
  }

  @Post("loginmc")
  @ApiOperation({ summary: 'Login Minecraft user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Minecraft user logged in successfully.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid world or credentials.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to login Minecraft user.' })
  async loginMC(@Body() loginMC: {username: string, uuid: string, world: string}) {
    if(loginMC.world !== process.env.MC_WORLD) return {error: 'Este login no funciona'};
    let usuario = await this.usersService.findFullUserWithUUID(loginMC.uuid);
    if(!usuario) {
      let usuario = await this.smartrotomUsersService.create(loginMC);
      return {error: 'Usuario creado en SmartRotom'};
    }
    
    return {
      data: usuario,
      statusCode: 200,
      message: 'Usuario encontrado'
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve users.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve user.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update user.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to delete user.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google authentication' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Google authentication initiated successfully.' })
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Post('google/callback')
  @ApiOperation({ summary: 'Handle Google authentication callback' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Google authentication completed successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to complete Google authentication.' })
  async googleAuthRedirect(@Body() body) {
    const user = await this.usersService.findByEmail(body.email);
    
    if (user) return {user, ok: true};
    const newUser = await this.usersService.createFromGoogle(body);
    return {user: newUser, ok: true};
  }
}