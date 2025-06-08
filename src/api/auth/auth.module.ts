import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { UsersService } from '@api/boffmedia/users/users.service';
import { StarbankModule } from '@api/smartrotom/starbank/starbank.module';

@Module({
  imports: [
    PassportModule,
    DrizzleModule,
    StarbankModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [GoogleStrategy, JwtStrategy, AuthService, UsersService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}