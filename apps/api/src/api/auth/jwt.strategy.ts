import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';
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
  constructor(
    private readonly usersService: BoffMediaUsersFacadeService,
    private readonly usersRepository: BoffMediaUsersRepository,
  ) {
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

    // Verify the session version. This replaces the user existence check that was
    // here before: getSessionVersion covers both concerns in one query (user exists +
    // not soft-deleted + current version is valid). The claim is `sv`, and tokens
    // minted before this feature was deployed carry no `sv` claim — treat a missing
    // `sv` as 0 so the backward-compatibility window closes automatically as old
    // tokens expire (in 15 minutes for access tokens, 7 days for refresh tokens).
    const embeddedVersion = payload.sv ?? 0;
    const currentVersion = await this.usersRepository.getSessionVersion(payload.sub);
    if (currentVersion === null || currentVersion !== embeddedVersion) {
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
