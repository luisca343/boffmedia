import { Controller, Post, Body, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { CreateUserDto } from '@/boffmedia/users/dto/create-user.dto';

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