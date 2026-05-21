import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
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
    const user = await this.usersService.getUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
