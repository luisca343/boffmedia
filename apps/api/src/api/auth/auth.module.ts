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
import { EmailVerificationsRepository } from './repositories/email-verifications.repository';
import { PasswordResetTokensRepository } from './repositories/password-reset-tokens.repository';
import { AuthController } from './auth.controller';
import { MinecraftController } from './minecraft.controller';
import { MinecraftLinkService } from './minecraft-link.service';
import { MinecraftHandshakeService } from './minecraft-handshake.service';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { StarbankModule } from '@api/smartrotom/starbank/starbank.module';
import { BoffMediaUsersModule } from '@api/boffmedia/users/users.module';
import { PasswordModule } from './password.module';
import { MailModule } from '@api/mail/mail.module';
import { OutboxModule } from '@api/outbox/outbox.module';
import { TokenSweeperService } from './token-sweeper.service';
import { TokenSweeperRepository } from './repositories/token-sweeper.repository';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PassportModule,
    DrizzleModule,
    StarbankModule,
    BoffMediaUsersModule,
    PasswordModule,
    MailModule,
    // Email verification and password reset enqueue their mail inside the same
    // transaction that stores the token.
    OutboxModule,
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
    PasswordResetTokensRepository,
    EmailVerificationService,
    EmailVerificationsRepository,
    MinecraftLinkService,
    MinecraftHandshakeService,
    TokenSweeperService,
    TokenSweeperRepository,
  ],
  exports: [
    AuthService,
    JwtModule,
    EmailVerificationService,
    MinecraftHandshakeService,
  ],
})
export class AuthModule {}
