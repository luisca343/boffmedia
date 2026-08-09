import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  TokenType,
  WEBSITE_TOKEN_TYPES,
  tokenTypeOf,
} from '@api/_utils/auth/token-types';
import { env } from '@/config/env';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: BoffMediaUsersFacadeService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // One secret signs website, refresh, launcher and in-game tokens alike, so
    // the `typ` claim is the only thing stopping a 7-day refresh token (or a
    // launcher session) from being replayed as a website session.
    const tokenType = tokenTypeOf(payload);
    if (!WEBSITE_TOKEN_TYPES.includes(tokenType as TokenType)) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.getUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
      tokenType,
      // Minecraft account uuid — the key StarBank/SmartRotom accounts are owned
      // by. Needed for money-route ownership checks (a user may only move their
      // own account's balance).
      mcUuid: payload.mcUuid,
    };
  }
}
