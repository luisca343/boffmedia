import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { env } from '@/config/env';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { EmailVerificationService } from './email-verification.service';
import { AuthController } from './auth.controller';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { StarbankModule } from '@api/smartrotom/starbank/starbank.module';
import { BoffMediaUsersModule } from '@api/boffmedia/users/users.module';
import { PasswordModule } from './password.module';
import { MailModule } from '@api/mail/mail.module';

@Module({
  imports: [
    PassportModule,
    DrizzleModule,
    StarbankModule,
    BoffMediaUsersModule,
    PasswordModule,
    MailModule,
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    GoogleStrategy,
    JwtStrategy,
    AuthService,
    PasswordResetService,
    EmailVerificationService,
  ],
  exports: [AuthService, JwtModule, EmailVerificationService],
})
export class AuthModule {}
