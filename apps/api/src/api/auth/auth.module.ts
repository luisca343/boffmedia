import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { env } from '@/config/env';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { EmailVerificationService } from './email-verification.service';
import { AuthController } from './auth.controller';
import { MinecraftController } from './minecraft.controller';
import { MinecraftLinkService } from './minecraft-link.service';
import { MinecraftHandshakeService } from './minecraft-handshake.service';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { StarbankModule } from '@api/smartrotom/starbank/starbank.module';
import { BoffMediaUsersModule } from '@api/boffmedia/users/users.module';
import { PasswordModule } from './password.module';
import { MailModule } from '@api/mail/mail.module';
import { TokenSweeperService } from './token-sweeper.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PassportModule,
    DrizzleModule,
    StarbankModule,
    BoffMediaUsersModule,
    PasswordModule,
    MailModule,
    // Microsoft's device-code endpoints and Mojang's sessionserver.
    HttpModule,
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController, MinecraftController],
  providers: [
    GoogleStrategy,
    JwtStrategy,
    AuthService,
    PasswordResetService,
    EmailVerificationService,
    MinecraftLinkService,
    MinecraftHandshakeService,
    TokenSweeperService,
  ],
  exports: [
    AuthService,
    JwtModule,
    EmailVerificationService,
    MinecraftHandshakeService,
  ],
})
export class AuthModule {}
