import { Controller, Post, Body, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { CreateUserDto } from '@api/boffmedia/users/dto/create-user.dto';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User logged in successfully.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials.' })
  async login(@Body() loginDto: CreateUserDto) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      return { error: 'Usuario o contraseña incorrectos' };
    }
    
    return this.authService.login(user);
  }

  @Post('loginmc')
  @ApiOperation({ summary: 'Login Minecraft user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Minecraft user logged in successfully.' })
  async loginMC(@Body() loginMC: {username: string, uuid: string, world: string}) {
    return this.authService.loginMC(loginMC);
  }

  @Post('register-minecraft')
  @ApiOperation({ summary: 'Register user with Minecraft account' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User registered successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  async registerMinecraft(@Body() registerDto: {
    username: string;
    email: string;
    password: string;
    minecraft: {
      username: string;
      uuid: string;
      world: string;
    };
  }) {
    return this.authService.registerMinecraft(registerDto);
  }

  @Post('link-minecraft')
  @ApiOperation({ summary: 'Link existing BoffMedia account to Minecraft' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Minecraft account linked successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  async linkMinecraft(@Body() linkDto: {
    username: string;
    email: string;
    password: string;
    minecraft: {
      username: string;
      uuid: string;
      world: string;
    };
  }) {
    return this.authService.linkMinecraft(linkDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token refreshed successfully.' })
  async refreshToken(@Body() body: { refresh_token: string }) {
    return this.authService.refreshToken(body.refresh_token);
  }

  @Post('google/callback')
  @ApiOperation({ summary: 'Handle Google authentication callback' })
  async googleAuthRedirect(@Body() body) {
    return this.authService.googleLogin(body);
  }
}