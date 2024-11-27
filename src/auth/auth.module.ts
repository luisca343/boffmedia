import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';
import { UsersModule } from '@/boffmedia/users/users.module';

@Module({
  imports: [
    PassportModule,
    UsersModule,
  ],
  providers: [GoogleStrategy],
})
export class AuthModule {}