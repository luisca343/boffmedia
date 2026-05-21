import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { env } from '@/config/env';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { StarbankModule } from '@api/smartrotom/starbank/starbank.module';
import { BoffMediaUsersModule } from '@api/boffmedia/users/users.module';

@Module({
  imports: [
    PassportModule,
    DrizzleModule,
    StarbankModule,
    BoffMediaUsersModule,
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [GoogleStrategy, JwtStrategy, AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
