import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { env } from '@/config/env';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly usersService: BoffMediaUsersFacadeService) {
    super({
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      name: `${name.givenName} ${name.familyName}`,
      googleId: profile.id,
    };

    try {
      const existingUser = await this.usersService.findByEmail(user.email);
      if (existingUser) {
        done(null, existingUser);
      } else {
        const newUser = await this.usersService.createFromGoogle(user);
        done(null, newUser);
      }
    } catch (error: any) {
      done(error, null);
    }
  }
}
