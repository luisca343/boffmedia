import {
  Controller,
  Post,
  Body,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthThrottlerGuard } from '@api/_utils/guards/auth-throttler.guard';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { EmailVerificationService } from './email-verification.service';
import { CreateUserDto } from '@api/boffmedia/users/dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleCallbackDto } from './dto/google-callback.dto';
import { DiscordCallbackDto } from './dto/discord-callback.dto';
import { TwitchCallbackDto } from './dto/twitch-callback.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import {
  AuthLoginResponseEntity,
  AuthRefreshResponseEntity,
} from './entities/auth-response.entity';

@ApiTags('BoffMedia | Authentication')
@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('login')
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged in successfully.',
    type: AuthLoginResponseEntity,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials.',
  })
  async login(@Body() loginDto: CreateUserDto) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException(
        userError(ApiErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid credentials'),
      );
    }

    return this.authService.login(user);
  }

  @Post('refresh')
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully.',
    type: AuthRefreshResponseEntity,
  })
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refresh_token);
  }

  @Post('google/callback')
  @ApiOperation({ summary: 'Handle Google authentication callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Google user authenticated successfully.',
    type: AuthLoginResponseEntity,
  })
  async googleAuthRedirect(@Body() body: GoogleCallbackDto) {
    return this.authService.googleLogin(body);
  }

  @Post('discord/callback')
  @ApiOperation({ summary: 'Handle Discord authentication callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Discord user authenticated successfully.',
    type: AuthLoginResponseEntity,
  })
  async discordAuthRedirect(@Body() body: DiscordCallbackDto) {
    return this.authService.discordLogin(body);
  }

  @Post('twitch/callback')
  @ApiOperation({ summary: 'Handle Twitch authentication callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Twitch user authenticated successfully.',
    type: AuthLoginResponseEntity,
  })
  async twitchAuthRedirect(@Body() body: TwitchCallbackDto) {
    return this.authService.twitchLogin(body);
  }

  // ==================== PASSWORD RESET ====================

  @Post('forgot')
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Request a password-reset email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Always succeeds (does not reveal whether the email is registered).',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.passwordResetService.requestReset(dto.email);
    // Generic response — never leak whether the address exists.
    return { success: true };
  }

  @Post('reset')
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Reset a password using an emailed token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password updated.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token, or weak password.',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto.token, dto.newPassword);
  }

  // ==================== EMAIL VERIFICATION ====================

  @Post('verify-email')
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Verify an email using an emailed token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email verified.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token.',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.emailVerificationService.verify(dto.token);
  }

  @Post('resend-verification')
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Send (or resend) a verification email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Always succeeds (does not reveal whether the email is registered/verified).',
  })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.emailVerificationService.sendVerification(dto.email);
    return { success: true };
  }
}
